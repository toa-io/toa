'use strict'

const { describe } = require('./describe')

const connectors = (context) => {
  const connectors = {}

  for (const manifest of context.manifests) {
    if (connectors[manifest.entity.storage] === undefined) {
      connectors[manifest.entity.storage] = []
    }

    connectors[manifest.entity.storage].push(
      describe(manifest, manifest.entity.storage, { entity: manifest.entity })
    )

    const bindings = new Set()

    if (manifest.operations !== undefined) {
      for (const operation of Object.values(manifest.operations)) {
        operation.bindings.forEach((binding) => bindings.add(binding))
      }
    }

    if (manifest.events !== undefined) {
      for (const event of Object.values(manifest.events)) {
        bindings.add(event.binding)
      }
    }

    for (const binding of bindings) {
      if (connectors[binding] === undefined) {
        connectors[binding] = []
      }

      connectors[binding].push(describe(manifest, binding))
    }
  }

  return connectors
}

exports.connectors = connectors
