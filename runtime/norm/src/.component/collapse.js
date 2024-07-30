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

  const { entity, events, extensions } = prototype

  if (manifest.entity?.schema?.properties.id !== undefined && entity?.schema?.properties.id !== undefined) {
    manifest.entity.custom = true

    delete prototype.entity.schema.properties.id
  }

  if (prototype.events !== undefined && manifest.events !== undefined)
    for (const event of Object.keys(prototype.events))
      if (event in manifest.events)
        delete prototype.events[event]

  merge(manifest, { entity, events, extensions })
}

exports.collapse = collapse
