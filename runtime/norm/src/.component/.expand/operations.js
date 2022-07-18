'use strict'

const { resolve } = require('../../shortcuts')
const { schema } = require('./schema')

function operations (manifest) {
  if (manifest.operations === undefined) return

  for (const operation of Object.values(manifest.operations)) {
    if (operation.input !== undefined) operation.input = schema(operation.input, true)
    if (operation.output !== undefined) operation.output = schema(operation.output, true)
    if (operation.bridge !== undefined) operation.bridge = resolve(operation.bridge)
    if (operation.bindings !== undefined) operation.bindings = operation.bindings.map(resolve)
  }
}

exports.operations = operations
