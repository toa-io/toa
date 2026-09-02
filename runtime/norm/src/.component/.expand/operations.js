'use strict'

const { resolve } = require('../../shortcuts')

function operations (manifest) {
  if (manifest.operations === undefined) return

  for (const operation of Object.values(manifest.operations)) {
    if (operation.bridge !== undefined) operation.bridge = resolve(operation.bridge)

    if (operation.bindings !== undefined && operation.bindings !== null) {
      operation.bindings = operation.bindings.map(resolve)
    }
  }
}

exports.operations = operations
