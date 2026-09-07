import {
  entity,
  bridge,
  operations,
  events,
  receivers,
  extensions,
  version
} from './.expand/index.js'

export async function expand(manifest) {
  entity(manifest)
  bridge(manifest)
  operations(manifest)
  events(manifest)
  receivers(manifest)
  extensions(manifest)

  await version(manifest)
}
