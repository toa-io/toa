import { instances } from './instances.js'

/**
 * @param {import('@toa.io/core').Context} component
 * @returns {import('@toa.io/core').Context}
 */
export const context = (component) => {
  let decorated = component

  for (const factory of Object.values(instances)) {
    if (factory.context !== undefined) decorated = factory.context(decorated)
  }

  return decorated
}
