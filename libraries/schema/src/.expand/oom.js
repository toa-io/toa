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

    let name = property.slice(0, -MARKER.length)

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

    properties[name] = schema

    delete properties[property]
  }
}

/**
 * @param {string }name
 * @returns {boolean}
 */
const marked = (name) => name.slice(-MARKER.length) === MARKER

const MARKER = '[]'

exports.oom = oom
