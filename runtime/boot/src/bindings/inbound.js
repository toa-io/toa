import { factory } from './factory.js'

// eslint-disable-next-line max-params
export const inbound = async (binding, channel, uris, label, sink) => {
  const instance = await factory(binding)

  if (instance.inbound === undefined)
    throw new Error(`Binding '${binding}' does not consume a channel`)

  return instance.inbound(channel, uris, label, sink)
}
