'use strict'

const dereference = (manifest) => {
  const property = resolve(manifest.entity.schema.properties)

  schema(manifest.entity.schema, property)

  for (const operation of Object.values(manifest.operations)) {
    schema(operation.input, property)
    schema(operation.output, property)
  }
}

const resolve = (schema) => (property) => {
  if (schema[property] === undefined) {
    throw new Error(`Referenced property '${property}' is not defined`)
  }

  return schema[property]
}

const schema = (object, resolve) => {
  if (object === undefined) return
  if (typeof object === 'string' && object[0] === '~') return resolve(object.substr(1))
  if (object.type in types) return types[object.type]

  if (object.type === 'array') {
    object.items = schema(object.items, resolve)
  } else if (object.properties !== undefined) {
    for (const [name, value] of Object.entries(object.properties)) {
      if (value === null) object.properties[name] = resolve(name)
      else object.properties[name] = schema(value, resolve)
    }
  }

  return object
}

const types = {
  id: { $ref: 'https://schemas.kookaburra.dev/0.0.0/definitions#/definitions/id' }
}

exports.dereference = dereference
