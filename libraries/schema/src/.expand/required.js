'use strict'

const { subtract } = require('@toa.io/libraries/generic')

/**
 * @param {toa.schema.JSON} schema
 */
function required (schema) {
  const required = new Set()
  const optional = new Set()

  for (const key of Object.keys(schema.properties)) {
    const { type, name } = parse(key)

    if (type === TYPES.plain) continue

    const set = type === TYPES.required ? required : optional

    set.add(name)

    schema.properties[name] = schema.properties[key]
    delete schema.properties[key]
  }

  if (optional.size > 0) {
    const properties = Object.keys(schema.properties)
    const diff = subtract(properties, optional)

    diff.forEach((item) => required.add(item))
  }

  if (required.size > 0) schema.required = Array.from(required)
}

/**
 * @param {string} key
 * @returns {{ type: number, name: string }}
 */
const parse = (key) => {
  const mark = key.slice(-1)
  const name = key.slice(0, -1)
  const type = MARKS[mark]

  if (type === undefined) return { type: TYPES.plain, name: key }
  else return { type, name }
}

const TYPES = {
  plain: 0,
  required: 1,
  optional: 2
}

const MARKS = {
  '*': TYPES.required,
  '?': TYPES.optional
}

exports.required = required
