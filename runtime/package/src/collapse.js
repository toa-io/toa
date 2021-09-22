'use strict'

const { lookup, merge } = require('@kookaburra/gears')

const collapse = (manifest, prototype, root) => {
  const path = lookup(manifest.prototype, root)

  delete prototype.domain
  delete prototype.name
  delete prototype.bindings
  delete prototype.entity?.storage
  delete manifest.prototype

  if (prototype.operations) {
    manifest.prototype = { prototype: prototype.prototype, path, operations: [] }

    if (!manifest.operations) manifest.operations = []

    for (const source of prototype.operations) {
      let target = manifest.operations.find((operation) => operation.name === source.name)

      if (!target) {
        target = {}
        manifest.operations.push(target)
      }

      const { bridge, binding, ...declaration } = source

      merge(target, declaration)

      if (bridge !== undefined) manifest.prototype.operations.push({ name: source.name, bridge })
    }

    delete prototype.operations
  }

  delete prototype.prototype

  merge(manifest, prototype)
}

exports.collapse = collapse
