'use strict'

const { expand } = require('@toa.io/schemas')
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

exports.operations = operations
