'use strict'

const { lookup, merge } = require('@kookaburra/gears')

const collapse = (manifest, prototype, root) => {
  const path = lookup.directory(manifest.prototype, root)

  delete manifest.prototype

  if (prototype.operations) {
    manifest.prototype = { prototype: prototype.prototype }

    const operations = Object.entries(prototype.operations)

    if (operations.length > 0) {
      if (manifest.operations === undefined) manifest.operations = {}

      for (const [endpoint, operation] of operations) {
        if (manifest.operations[endpoint] === undefined) manifest.operations[endpoint] = {}

        const { bridge, binding, ...declaration } = operation

        merge(manifest.operations[endpoint], declaration)

        if (bridge !== undefined) {
          if (manifest.prototype.operations === undefined) {
            manifest.prototype.operations = {}
            manifest.prototype.path = path
          }

          manifest.prototype.operations[endpoint] = { bridge }
        }
      }
    }

    delete prototype.operations
  }

  delete prototype.domain
  delete prototype.name
  delete prototype.bindings
  delete prototype.entity?.storage
  delete prototype.prototype

  merge(manifest, prototype)
}

exports.collapse = collapse
