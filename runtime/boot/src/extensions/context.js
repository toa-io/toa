import { instances } from './instances.js'

/**
 * @param {toa.core.Context} component
 * @returns {toa.core.Context}
 */
export const context = (component) => {
  let decorated = component

  for (const factory of Object.values(instances)) {
    if (factory.context !== undefined) decorated = factory.context(decorated)
  }

  return decorated
}
