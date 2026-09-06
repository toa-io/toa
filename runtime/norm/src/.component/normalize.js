import { entity, events, operations, receivers } from './.normalize/index.js'

/**
 * What a manifest does not say but the runtime needs said. The schema states what a value may
 * be; what it is where nothing was written is decided here, so that validating a manifest is
 * reading it rather than completing it.
 */
export const normalize = async (component) => {
  component.namespace ??= 'default'

  entity(component)
  operations(component)
  await events(component)
  receivers(component)
}
