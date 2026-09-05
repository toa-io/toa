import { instances } from './instances.js'

/**
 * @param {import('@toa.io/core/types').bindings.Emitter} emitter
 * @param {string} label
 * @param {import('@toa.io/core').Locator} locator
 * @returns {import('@toa.io/core/types').bindings.Emitter}
 */
export const emitter = (emitter, label, locator) => {
  let decorated = emitter

  for (const factory of Object.values(instances)) {
    if (factory.emitter !== undefined) decorated = factory.emitter(decorated, label, locator)
  }

  return decorated
}
