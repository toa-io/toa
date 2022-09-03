'use strict'

/**
 * @param {toa.schema.JSON} schema
 */
function required (schema) {
  const required = []

  for (const key of Object.keys(schema.properties)) {
    const last = key.slice(-1)

    if (last === '*') {
      const name = key.slice(0, -1)

      schema.properties[name] = schema.properties[key]
      required.push(name)

      delete schema.properties[key]
    }
  }

  if (required.length > 0) schema.required = required
}

exports.required = required
