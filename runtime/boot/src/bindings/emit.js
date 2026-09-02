import { factory } from './factory.js'

const emit = async (binding, locator, label) =>
  (await factory(binding)).emitter(locator, label)

export { emit }
