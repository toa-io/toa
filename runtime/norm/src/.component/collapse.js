import { merge } from '@toa.io/generic'

export const collapse = (manifest, prototype) => {
  delete manifest.prototype

  if (prototype.operations) {
    manifest.prototype = { prototype: prototype.prototype, path: prototype.path }

    const operations = Object.entries(prototype.operations)

    if (operations.length > 0) {
      if (manifest.operations === undefined) manifest.operations = {}

      for (let [endpoint, operation] of operations) {
        if (manifest.operations[endpoint] === undefined)
          manifest.operations[endpoint] = {}
        else {
          const { virtual, ...real } = operation

          operation = real
        }

        const { bridge, binding, ...declaration } = operation

        merge(manifest.operations[endpoint], declaration)

        if (bridge !== undefined) {
          if (manifest.prototype.operations === undefined)
            manifest.prototype.operations = {}

          manifest.prototype.operations[endpoint] = { bridge }
        }
      }
    }
  }

  const { entity, events, extensions } = prototype

  if (
    manifest.entity?.properties?.id !== undefined &&
    entity?.properties?.id !== undefined
  ) {
    manifest.entity.custom = true

    delete prototype.entity.properties.id
  }

  if (prototype.events !== undefined && manifest.events !== undefined)
    for (const event of Object.keys(prototype.events))
      if (event in manifest.events) delete prototype.events[event]

  // a migration is applied to a collection, and a prototype has none: what it declares belongs
  // to the component that declared it, so it is not collapsed into this one
  if (entity?.migrations !== undefined) delete entity.migrations

  merge(manifest, { entity, events, extensions })
}
