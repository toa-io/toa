'use strict'

const { merge } = require('@toa.io/gears')

const collapse = (manifest, prototype) => {
  delete manifest.prototype

  if (prototype.operations) {
    manifest.prototype = { prototype: prototype.prototype, path: prototype.path }

    const operations = Object.entries(prototype.operations)

    if (operations.length > 0) {
      if (manifest.operations === undefined) manifest.operations = {}

      for (const [endpoint, operation] of operations) {
        if (manifest.operations[endpoint] === undefined) manifest.operations[endpoint] = {}

        const { bridge, binding, ...declaration } = operation

        merge(manifest.operations[endpoint], declaration)

        if (bridge !== undefined) {
          if (manifest.prototype.operations === undefined) manifest.prototype.operations = {}

          manifest.prototype.operations[endpoint] = { bridge }
        }
      }
    }
  }

  delete prototype.entity?.storage

  const { entity, remotes, events } = prototype

  merge(manifest, { entity, remotes, events })
}

exports.collapse = collapse
