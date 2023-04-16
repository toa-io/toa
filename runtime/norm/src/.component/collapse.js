'use strict'

const { merge } = require('@toa.io/generic')

const collapse = (manifest, prototype) => {
  delete manifest.prototype

  if (prototype.operations) {
    manifest.prototype = { prototype: prototype.prototype, path: prototype.path }

    const operations = Object.entries(prototype.operations)

    if (operations.length > 0) {
      if (manifest.operations === undefined) manifest.operations = {}

      for (let [endpoint, operation] of operations) {
        if (manifest.operations[endpoint] === undefined) manifest.operations[endpoint] = {}
        else {
          const { virtual, ...real } = operation

          operation = real
        }

        const { bridge, binding, ...declaration } = operation

        merge(manifest.operations[endpoint], declaration)

        if (bridge !== undefined) {
          if (manifest.prototype.operations === undefined) manifest.prototype.operations = {}

          manifest.prototype.operations[endpoint] = { bridge }
        }
      }
    }
  }

  delete prototype.entity?.storage // ???

  const { entity, events } = prototype

  merge(manifest, { entity, events })
}

exports.collapse = collapse
