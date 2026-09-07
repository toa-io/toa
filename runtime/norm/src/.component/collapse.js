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

  /*
   * `id` is the only one a component may state for itself. The rest are written by the runtime
   * and read by it, so one redeclared here would be merged over what the prototype says and
   * change what the record holds, or what a criterion against it compares — without the
   * component that wrote it having anything to do with either.
   */
  for (const name of SYSTEM)
    if (
      manifest.entity?.properties?.[name] !== undefined &&
      entity?.properties?.[name] !== undefined
    )
      throw new Error(`System property '${name}' cannot be overridden`)

  if (prototype.events !== undefined && manifest.events !== undefined)
    for (const event of Object.keys(prototype.events))
      if (event in manifest.events) delete prototype.events[event]

  if (entity?.migrations !== undefined) inherit(manifest, prototype)

  merge(manifest, { entity, events, extensions })
}

/**
 * What a prototype declares is in every record of its descendants, so its migrations are applied
 * to each descendant's collection — ahead of the descendant's own, which are written against
 * what they leave. An inherited one is recorded under the prototype's name, so that it collides
 * with nothing the component names itself; one inherited from further up already carries its
 * name and is passed on as it is.
 */
function inherit(manifest, prototype) {
  const inherited = prototype.entity.migrations.map((migration) =>
    migration.prototype === undefined
      ? {
          ...migration,
          id: `${prototype.name}:${migration.id}`,
          prototype: prototype.name
        }
      : migration
  )

  const own = manifest.entity?.migrations ?? []

  if (manifest.entity === undefined) manifest.entity = {}

  manifest.entity.migrations = [...inherited, ...own]

  // merged below by `merge`, which would append them a second time
  delete prototype.entity.migrations
}

/** What the runtime writes into every record. `id` is not among them: a component may own it. */
const SYSTEM = ['VERSION', 'CREATED', 'UPDATED', 'DELETED']
