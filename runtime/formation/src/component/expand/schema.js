'use strict'

const schema = (object, root) => {
  if (object === undefined || object === null) return object
  if (typeof object === 'string' && object[0] !== '~') return { type: object }

  if (object.type === 'array') object.items = schema(object.items)
  else if (typeof object === 'object') {
    if (object.properties !== undefined) {
      for (const [name, value] of Object.entries(object.properties)) {
        object.properties[name] = schema(value)
      }
    } else if (object.type === undefined && root === true) return schema({ properties: object })
  }

  return object
}

exports.schema = schema
