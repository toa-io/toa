import { factory } from './factory.js'

const broadcast = async (channel, group, binding = '@toa.io/bindings.amqp') =>
  (await factory(binding)).broadcast(channel, group)

export { broadcast }
