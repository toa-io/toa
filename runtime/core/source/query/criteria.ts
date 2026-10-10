import { parse } from '@toa.io/rsql'
import { QuerySyntaxException } from '../exceptions.ts'
import { property as find } from './property.ts'
import type { Literal } from '@toa.io/rsql'
import type { Node } from '../types/storages.ts'
import type { Properties } from './property.ts'

export function criteria(expression: string, properties?: Properties): Node {
  try {
    return parse(expression, (literal) => read(literal, properties))
  } catch (e) {
    if (e instanceof SyntaxError) throw new QuerySyntaxException(e.message)

    throw e
  }
}

/** What a value of a criteria is, as the property it is compared with holds it. */
function read(
  { text, quoted, selector, operator }: Literal,
  properties?: Properties
): unknown {
  const property = properties === undefined ? undefined : find(properties, selector)

  if (properties !== undefined && property === undefined)
    throw new QuerySyntaxException(`Criteria selector '${selector}' is not defined`)

  // an unquoted `null` or `undefined` is no value, and a quoted one is text
  if (!quoted && (text === 'null' || text === 'undefined')) {
    // no value is neither greater nor less than anything, and a storage asked to order by it
    // finds nothing and says nothing
    if (!EQUALITY.includes(operator))
      throw new QuerySyntaxException(
        `Criteria selector '${selector}' compares no value with '${operator}'`
      )

    // no value is no property's to read
    return null
  }

  const cast = property?.type === undefined ? undefined : CAST[property.type]

  return cast === undefined ? text : cast(text, selector)
}

const EQUALITY = ['==', '!=', '=in=', '=out=']

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
