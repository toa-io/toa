'use strict'

const traverse = (manifest) => {
  const property = resolve(manifest.entity.schema.properties)

  for (const operation of manifest.operations) {
    dereference(operation.input, property)
    dereference(operation.output, property)
  }
}

const resolve = (schema) => (property) => {
  if (schema[property] === undefined) {
    throw new Error(`Referenced property '${property}' is not defined`)
  }

  return schema[property]
}

const dereference = (object, resolve) => {
  if (object === undefined) return
  if (typeof object === 'string' && object[0] === '~') return resolve(object.substr(1))

  if (object.type === 'array') {
    object.items = dereference(object.items, resolve)
  } else if (object.properties !== undefined) {
    for (const [name, value] of Object.entries(object.properties)) {
      if (value === null) object.properties[name] = resolve(name)
      else object.properties[name] = dereference(value, resolve)
    }
  }

  return object
}

exports.dereference = traverse
