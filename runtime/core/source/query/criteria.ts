import { parse } from '@rsql/parser'
import { QuerySyntaxException } from '../exceptions.ts'
import type { Node } from '../types/storages.ts'

/** What a component declares about the properties a criteria may select on. */
export type Properties = Record<string, { type: string }>

export function criteria(expression: string, properties?: Properties): Node {
  let ast: Node

  try {
    ast = parse(expression) as unknown as Node
  } catch (e) {
    throw new QuerySyntaxException((e as Error).message)
  }

  // what spells neither word holds neither, and pays nothing for this
  if (expression.includes('null') || expression.includes('undefined')) nothing(ast, expression)

  if (properties !== undefined) read(ast, properties)

  return ast
}

/**
 * An unquoted `null` or `undefined` is no value, and a quoted one is text. The parser answers
 * both as the text, so which of them was quoted is read from the expression: a value is what
 * follows a comparison operator, or the list in parentheses that does, and the tree holds the
 * values in the order the expression writes them.
 */
function nothing(ast: Node, expression: string): void {
  const quoted = values(expression)
  let index = 0

  function resolve(value: unknown): unknown {
    return !quoted[index++] && (value === 'null' || value === 'undefined') ? null : value
  }

  comparisons(ast, (node) => {
    const right = node.right!

    right.value = Array.isArray(right.value) ? right.value.map(resolve) : resolve(right.value)

    const none = Array.isArray(right.value) ? right.value.includes(null) : right.value === null

    // no value is neither greater nor less than anything, and a storage asked to order by it
    // finds nothing and says nothing
    if (none && !EQUALITY.includes(node.operator!))
      throw new QuerySyntaxException(
        `Criteria selector '${node.left!.selector}' compares no value with '${node.operator}'`
      )
  })
}

const EQUALITY = ['==', '!=', '=in=', '=out=']

function comparisons(node: Node, visit: (node: Node) => void): void {
  if (node.type === 'COMPARISON') visit(node)
  else if (node.type === 'LOGIC') {
    comparisons(node.left!, visit)
    comparisons(node.right!, visit)
  }
}

/**
 * Whether each value of an expression the parser has accepted is quoted, in the order they are
 * written. Tokens are told apart as the parser's lexer tells them.
 */
function values(expression: string): boolean[] {
  const quoted: boolean[] = []
  let position = 0
  let value = false
  let list = false

  while (position < expression.length) {
    const char = expression[position]

    if (WHITESPACE.includes(char)) {
      position++
    } else if (char === '"' || char === "'") {
      position = closing(expression, position) + 1

      if (value) quoted.push(true)

      value = list
    } else if (char === '(') {
      position++
      list = value
    } else if (char === ')') {
      position++
      list = value = false
    } else if (char === ',' || char === ';') {
      position++
    } else if (OPERATOR_START.includes(char)) {
      OPERATOR.lastIndex = position
      position = OPERATOR.test(expression) ? OPERATOR.lastIndex : position + 1
      value = true
    } else {
      position++

      while (position < expression.length && !RESERVED.includes(expression[position])) position++

      if (value) quoted.push(false)

      value = list
    }
  }

  return quoted
}

/** The quote that closes the one at `position`: the first one not escaped by a backslash. */
function closing(expression: string, position: number): number {
  const quote = expression[position]
  let end = position

  for (;;) {
    end = expression.indexOf(quote, end + 1)

    if (end === -1) return expression.length

    let escaped = false

    for (let back = end - 1; expression[back] === '\\' && back > position; back--)
      escaped = !escaped

    if (!escaped) return end
  }
}

const WHITESPACE = ' \n\t\r'
const RESERVED = `"'();,=!~<> \n\t\r`
const OPERATOR_START = '=!<>'
const OPERATOR = /=[a-z]*=|[!<>]=?/y

function read(node: Node, properties: Properties): void {
  if (
    node.type === 'COMPARISON' &&
    node.left?.type === 'SELECTOR' &&
    node.right?.type === 'VALUE'
  ) {
    const selector = node.left.selector as string
    const property = properties[selector]

    if (property === undefined) {
      throw new QuerySyntaxException(`Criteria selector '${selector}' is not defined`)
    }

    const cast = CAST[property.type]

    // `=in=` and `=out=` carry a list, and casting that as one value gives whatever
    // a comma-separated string reads as
    // no value is no property's to read
    if (cast !== undefined)
      node.right.value = Array.isArray(node.right.value)
        ? node.right.value.map((value: string | null) =>
            value === null ? null : cast(value, selector)
          )
        : node.right.value === null
          ? null
          : cast(node.right.value as string, selector)
  } else {
    if (node.left !== undefined) read(node.left, properties)
    if (node.right !== undefined) read(node.right, properties)
  }
}

/**
 * A criteria arrives as text, so a value is read as what the property it selects on holds. What
 * cannot be read as that is refused rather than passed on: `parseInt` answers `NaN` for a word
 * and `12` for `12kg`, and a storage asked to match either finds nothing and says nothing —
 * a mistyped filter reads as an empty result.
 *
 * A string is left as it came, because every text is one: what a criteria may compare a string
 * to is not the type's to say.
 */
const CAST: Record<string, (value: string, selector: string) => unknown> = {
  number: (value, selector) => finite(value, selector, 'a number'),

  integer: (value, selector) => {
    const number = finite(value, selector, 'an integer')

    if (!Number.isInteger(number)) refuse(selector, 'an integer', value)

    return number
  },

  boolean: (value, selector) => {
    if (value === 'true') return true
    if (value === 'false') return false

    return refuse(selector, 'a boolean', value)
  }
}

function finite(value: string, selector: string, expected: string): number {
  // `Number` reads a blank string as zero, and a criteria that says nothing says nothing
  const number = value.trim() === '' ? Number.NaN : Number(value)

  if (!Number.isFinite(number)) refuse(selector, expected, value)

  return number
}

function refuse(selector: string, expected: string, value: string): never {
  throw new QuerySyntaxException(
    `Criteria selector '${selector}' takes ${expected}, and '${value}' is not one`
  )
}
