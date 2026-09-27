/**
 * Whether a record matches a filter `translate` wrote, as MongoDB would decide it. A change
 * stream says a record changed, and whether a reader is to add it or drop it is whether its
 * image after the change matches the reader's criteria, or only its image before.
 *
 * What `translate` writes is all there is to decide: `$and`, `$or`, and a field compared with
 * `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin` or a bare value. A search is not a
 * filter on a record, and is refused.
 *
 * @param {object} record
 * @param {object} filter
 * @returns {boolean}
 */
export function match(record, filter) {
  for (const [key, condition] of Object.entries(filter))
    if (!matches(record, key, condition)) return false

  return true
}

function matches(record, key, condition) {
  switch (key) {
    case '$and':
      return condition.every((filter) => match(record, filter))
    case '$or':
      return condition.some((filter) => match(record, filter))
    case '$nor':
      return !condition.some((filter) => match(record, filter))
    default:
      if (key.startsWith('$')) throw new Error(`A change cannot be matched against '${key}'`)

      return field(read(record, key), condition)
  }
}

function field(value, condition) {
  if (!operators(condition)) return OPERATORS.$eq(value, condition)

  for (const [operator, operand] of Object.entries(condition)) {
    const test = OPERATORS[operator]

    if (test === undefined) throw new Error(`A change cannot be matched against '${operator}'`)
    if (!test(value, operand)) return false
  }

  return true
}

const OPERATORS = {
  $eq: (value, operand) => some(value, (v) => equal(v, operand)),
  $ne: (value, operand) => !OPERATORS.$eq(value, operand),
  $in: (value, operands) => operands.some((operand) => OPERATORS.$eq(value, operand)),
  $nin: (value, operands) => !OPERATORS.$in(value, operands),
  $gt: (value, operand) => some(value, (v) => compare(v, operand) > 0),
  $gte: (value, operand) => some(value, (v) => compare(v, operand) >= 0),
  $lt: (value, operand) => some(value, (v) => compare(v, operand) < 0),
  $lte: (value, operand) => some(value, (v) => compare(v, operand) <= 0)
}

/** An array matches where the array or one of its elements does, as MongoDB has it. */
function some(value, test) {
  return test(value) || (Array.isArray(value) && value.some(test))
}

/** `null` is equal to a field that is not there, and a date to a date of the same instant. */
function equal(value, operand) {
  if (operand === null) return value === null || value === undefined
  if (operand instanceof Date) return value instanceof Date && value.getTime() === operand.getTime()

  return value === operand
}

/** Values of one type compare, and values of two types are neither greater nor less. */
function compare(value, operand) {
  if (value instanceof Date && operand instanceof Date) return value.getTime() - operand.getTime()
  if (typeof value === 'number' && typeof operand === 'number') return value - operand

  if (typeof value === 'string' && typeof operand === 'string')
    return value < operand ? -1 : value > operand ? 1 : 0

  return NaN
}

function operators(condition) {
  if (condition === null || typeof condition !== 'object' || condition instanceof Date) return false
  if (Array.isArray(condition)) return false

  const keys = Object.keys(condition)

  return keys.length > 0 && keys.every((key) => key.startsWith('$'))
}

function read(record, path) {
  let value = record

  for (const key of path.split('.')) {
    if (value === null || typeof value !== 'object') return undefined

    value = value[key]
  }

  return value
}
