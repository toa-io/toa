import { instances } from './instances.js'

/**
 * @param {import('@toa.io/core').Component} component
 * @returns {import('@toa.io/core').Component}
 */
export const component = (component) => {
  let decorated = component

  for (const factory of Object.values(instances)) {
    if (factory.component !== undefined) decorated = factory.component(decorated)
  }

  return decorated
}
