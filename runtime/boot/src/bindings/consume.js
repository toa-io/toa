import { LOOP } from './constants.js'
import { factory } from './factory.js'

const consume = async (locator, endpoint, bindings) =>
  await Promise.all([LOOP].concat(bindings).map(async (binding) =>
    (await factory(binding)).consumer(locator, endpoint)))

export { consume }
