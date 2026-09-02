import { entity, bridge, operations, events, receivers, extensions, properties, version } from './.expand/index.js'

async function expand (manifest) {
  entity(manifest)
  bridge(manifest)
  operations(manifest)
  events(manifest)
  receivers(manifest)
  properties(manifest)
  extensions(manifest)

  await version(manifest)
}

export { expand }
