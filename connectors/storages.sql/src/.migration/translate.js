import { refs, types } from './.translate/index.js'

/**
 * @param {Object} schema
 * @returns {string}
 */
export const translate = (schema) => {
  const properties = []

  for (const [name, property] of Object.entries(schema.properties)) {
    let value

    if (property.$ref !== undefined) value = refs[property.$ref](name, property)
    else value = `"${name}" ${types[property.type](name, property)}`

    properties.push(value)
  }

  return properties.join(', ')
}
