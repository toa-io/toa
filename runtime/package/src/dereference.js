'use strict'

const { merge } = require('@kookaburra/gears')
const dereference = (manifest) => {
  // schemas
  const property = resolve(manifest.entity.schema.properties)

  schema(manifest.entity.schema, property)

  for (const operation of Object.values(manifest.operations)) {
    if (operation.input !== undefined) operation.input = schema(operation.input, property)
    if (operation.output !== undefined) operation.output = schema(operation.output, property)
  }

  // forwarding
  for (const operation of Object.values(manifest.operations)) {
    if (operation.forward !== undefined) forward(operation, manifest.operations)
  }

  for (const operation of Object.values(manifest.operations)) {
    delete operation.forwarded
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

const forward = (operation, operations) => {
  const target = operations[operation.forward]

  if (target === undefined) throw new Error(`Referenced operation '${operation.forward}' is not defined`)

  if (target.forward !== undefined) {
    if (target.forwarded !== true) forward(target, operations)

    operation.forward = target.forward
  }

  operation.forwarded = true

  merge(operation, target)
}

exports.dereference = dereference
