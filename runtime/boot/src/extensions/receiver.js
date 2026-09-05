import { instances } from './instances.js'

/**
 * @param {import('@toa.io/core/types').Receiver} receiver
 * @param {import('@toa.io/core').Locator} locator
 * @returns {import('@toa.io/core/types').Receiver}
 */
export const receiver = (receiver, locator) => {
  let decorated = receiver

  for (const factory of Object.values(instances)) {
    if (factory.receiver !== undefined)
      decorated = factory.receiver(decorated, locator)
  }

  return decorated
}
