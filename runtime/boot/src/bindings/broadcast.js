import { factory } from './factory.js'

export const broadcast = async (channel, group, binding = '@toa.io/bindings.amqp') =>
  (await factory(binding)).broadcast(channel, group)
