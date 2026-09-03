import { factory } from './factory.js'

export const emit = async (binding, locator, label) =>
  (await factory(binding)).emitter(locator, label)
