import { factory } from './factory.js'

export const receive = async (binding, locator, label, group, receiver) =>
  (await factory(binding)).receiver(locator, label, group, receiver)
