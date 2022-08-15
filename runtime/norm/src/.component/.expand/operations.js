'use strict'

const { expand } = require('@toa.io/libraries/schema')
const { resolve } = require('../../shortcuts')

function operations (manifest) {
  if (manifest.operations === undefined) return

  for (const operation of Object.values(manifest.operations)) {
    if (operation.input !== undefined) operation.input = expand(operation.input)
    if (operation.output !== undefined) operation.output = expand(operation.output)
    if (operation.bridge !== undefined) operation.bridge = resolve(operation.bridge)
    if (operation.bindings !== undefined) operation.bindings = operation.bindings.map(resolve)
  }
}

// const schema = (schema, entity) => {
//   const properties = schema.properties ?? schema
//
//   for (const [name, value] of Object.entries(properties)) {
//     if (value === null) {
//       properties[name] = entity.properties[name]
//     } else if (typeof value === 'string' && value[0] === '~') {
//       const key = value.substring(1)
//
//       properties[name] = entity.properties[key]
//     }
//   }
//
//   return expand(schema)
// }

exports.operations = operations
