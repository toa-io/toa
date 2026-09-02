import { factory } from './factory.js'

const receive = async (binding, locator, label, group, receiver) =>
  (await factory(binding)).receiver(locator, label, group, receiver)

export { receive }
