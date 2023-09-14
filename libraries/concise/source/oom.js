'use strict'

/**
 * One or many
 *
 * @param {Object} properties
 * @returns {Object}
 */
const oom = (properties) => {
  for (const [property, value] of Object.entries(properties)) {
    if (!marked(property)) continue

    let name = property.slice(0, -INDICATOR.length)

    if (name === '~') name = 'null'

    const schema = {
      oneOf: [
        value,
        {
          type: 'array',
          items: value
        }
      ]
    }

    if (value.default !== undefined)
      schema.default = value.default

    properties[name] = schema

    delete properties[property]
  }
}

/**
 * @param {string }name
 * @returns {boolean}
 */
const marked = (name) => name.slice(-INDICATOR.length) === INDICATOR

const INDICATOR = '+'

exports.oom = oom
