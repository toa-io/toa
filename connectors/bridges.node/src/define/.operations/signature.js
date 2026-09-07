/**
 * What an algorithm is declared as, read from its source: a function, an arrow or a class,
 * and the names of its parameters. That is all the conventions need, and a parser of the
 * whole language is a dependency every process would carry for the length of its life.
 *
 * @param {Function} func
 * @returns {toa.node.define.algorithms.Statement}
 */
export const signature = (func) => {
  const tokens = tokenize(func.toString())
  const reader = new Reader(tokens)

  if (reader.is('class')) return declaration(reader)

  if (reader.is('async')) reader.next()

  if (reader.is('function')) {
    reader.next()

    if (reader.is('*')) reader.next()
    if (reader.identifier()) reader.next()

    return { type: 'FunctionDeclaration', params: parameters(reader) }
  }

  if (reader.identifier() && reader.peek(1)?.value === '=>')
    return { type: 'ArrowFunctionExpression', params: [{ name: reader.next().value }] }

  if (reader.is('(')) {
    const params = parameters(reader)

    if (reader.is('=>')) return { type: 'ArrowFunctionExpression', params }
  }

  throw new Error(`'${func.name}' is not a function, an arrow or a class`)
}

/**
 * A class is read for its methods: the name of each and its parameters.
 * A method is a name followed by a parameter list at the body's own level,
 * after a modifier or the end of the previous member.
 *
 * @param {Reader} reader
 * @returns {toa.node.define.algorithms.Statement}
 */
const declaration = (reader) => {
  while (!reader.is('{')) reader.next()

  reader.next()

  const body = []

  let depth = 1
  let previous = '{'

  while (depth > 0) {
    const token = reader.next()

    if (token === undefined) throw new Error('Class body is not closed')

    if (token.value === '{') depth++
    else if (token.value === '}') depth--
    else if (
      depth === 1 &&
      token.type === 'identifier' &&
      MEMBER.has(previous) &&
      reader.is('(')
    )
      body.push({
        type: 'ClassMethod',
        key: { name: token.value },
        params: parameters(reader)
      })

    previous = token.value
  }

  return { type: 'ClassDeclaration', body: { body } }
}

/**
 * A parenthesized list, split at its own commas. A parameter is the name it starts with;
 * a pattern has none, the way a parser sees it.
 *
 * @param {Reader} reader
 * @returns {toa.node.define.algorithms.Parameter[]}
 */
const parameters = (reader) => {
  if (!reader.is('(')) throw new Error('Parameter list expected')

  reader.next()

  const params = []

  let depth = 0
  let first = true

  for (;;) {
    const token = reader.next()

    if (token === undefined) throw new Error('Parameter list is not closed')

    if (depth === 0 && token.value === ')') break

    if (depth === 0 && token.value === ',') {
      first = true
      continue
    }

    if (first) {
      params.push({ name: token.type === 'identifier' ? token.value : undefined })
      first = false
    }

    if (OPENING.has(token.value)) depth++
    else if (CLOSING.has(token.value)) depth--
  }

  return params
}

class Reader {
  #tokens
  #position = 0

  constructor(tokens) {
    this.#tokens = tokens
  }

  peek(offset = 0) {
    return this.#tokens[this.#position + offset]
  }

  next() {
    return this.#tokens[this.#position++]
  }

  is(value) {
    return this.peek()?.value === value
  }

  identifier() {
    return this.peek()?.type === 'identifier'
  }
}

/**
 * Splits source into what the conventions are read from. Strings, templates, comments and
 * regular expressions are passed over, so a bracket inside one does not count.
 *
 * @param {string} source
 * @returns {Token[]}
 */
const tokenize = (source) => {
  /** @type {Token[]} */
  const tokens = []

  let i = 0

  const push = (type, value) => tokens.push({ type, value })

  while (i < source.length) {
    const char = source[i]
    const pair = source.slice(i, i + 2)

    if (WHITESPACE.test(char)) i++
    else if (pair === '//') i = lineEnd(source, i)
    else if (pair === '/*') i = source.indexOf('*/', i + 2) + 2 || source.length
    else if (char === "'" || char === '"') {
      i = quoted(source, i, char)
      push('string', '')
    } else if (char === '`') {
      i = template(source, i)
      push('string', '')
    } else if (char === '/' && regexAllowed(tokens.at(-1))) {
      i = regex(source, i)
      push('regex', '')
    } else if (IDENTIFIER.test(char)) {
      const match = source.slice(i).match(IDENTIFIER_RUN)
      i += match[0].length
      push('identifier', match[0])
    } else if (DIGIT.test(char)) {
      const match = source.slice(i).match(NUMBER)
      i += match[0].length
      push('number', match[0])
    } else if (pair === '=>' || pair === '..') {
      const value = pair === '..' ? '...' : pair
      i += value.length
      push('punctuator', value)
    } else {
      i++
      push('punctuator', char)
    }
  }

  return tokens
}

const lineEnd = (source, i) => {
  const end = source.indexOf('\n', i)

  return end === -1 ? source.length : end
}

const quoted = (source, i, quote) => {
  for (i++; i < source.length; i++) {
    if (source[i] === '\\') i++
    else if (source[i] === quote) return i + 1
  }

  return i
}

/** A template is read to its closing backtick, through the expressions it carries. */
const template = (source, i) => {
  for (i++; i < source.length; i++) {
    if (source[i] === '\\') i++
    else if (source[i] === '`') return i + 1
    else if (source.slice(i, i + 2) === '${') i = expression(source, i + 2) - 1
  }

  return i
}

/** An expression inside a template is read to the brace that closes it. */
const expression = (source, i) => {
  let depth = 1

  while (i < source.length) {
    const char = source[i]

    if (char === "'" || char === '"') i = quoted(source, i, char)
    else if (char === '`') i = template(source, i)
    else if (source.slice(i, i + 2) === '//') i = lineEnd(source, i)
    else if (source.slice(i, i + 2) === '/*')
      i = source.indexOf('*/', i + 2) + 2 || source.length
    else {
      if (char === '{') depth++
      else if (char === '}') depth--

      i++

      if (depth === 0) return i
    }
  }

  return i
}

const regex = (source, i) => {
  let inClass = false

  for (i++; i < source.length; i++) {
    const char = source[i]

    if (char === '\\') i++
    else if (char === '[') inClass = true
    else if (char === ']') inClass = false
    else if (char === '/' && !inClass) break
    else if (char === '\n') break
  }

  i++

  while (i < source.length && IDENTIFIER.test(source[i])) i++

  return i
}

/**
 * A slash after a value divides; anywhere else it opens a regular expression.
 *
 * @param {Token | undefined} previous
 */
const regexAllowed = (previous) => {
  if (previous === undefined) return true
  if (previous.type === 'identifier') return KEYWORDS.has(previous.value)
  if (previous.type === 'punctuator') return !DIVIDEND.has(previous.value)

  return false
}

/** @typedef {{ type: 'identifier' | 'number' | 'string' | 'regex' | 'punctuator', value: string }} Token */

const WHITESPACE = /\s/
const DIGIT = /\d/
const IDENTIFIER = /[\p{ID_Start}$_#]/u
const IDENTIFIER_RUN = /^[\p{ID_Start}$_#][\p{ID_Continue}$\u200c\u200d]*/u
const NUMBER = /^[\w.]+/

/** what stands before the name of a class member */
const MEMBER = new Set(['{', '}', ';', 'static', 'async', '*', 'get', 'set'])
const OPENING = new Set(['(', '[', '{'])
const CLOSING = new Set([')', ']', '}'])
const DIVIDEND = new Set([')', ']', '}'])

const KEYWORDS = new Set([
  'return',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'delete',
  'void',
  'throw',
  'case',
  'do',
  'else',
  'yield',
  'await'
])
