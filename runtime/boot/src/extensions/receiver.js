import { instances } from './instances.js'

/**
 * @param {toa.core.Receiver} receiver
 * @param {toa.core.Locator} locator
 * @returns {toa.core.Receiver}
 */
const receiver = (receiver, locator) => {
  let decorated = receiver

  for (const factory of Object.values(instances)) {
    if (factory.receiver !== undefined)
      decorated = factory.receiver(decorated, locator)
  }

  return decorated
}

export { receiver }
