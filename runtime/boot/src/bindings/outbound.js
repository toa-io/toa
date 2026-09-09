import { factory } from './factory.js'

export const outbound = async (binding, channel, uris) => {
  const instance = await factory(binding)

  if (instance.outbound === undefined)
    throw new Error(`Binding '${binding}' does not publish a channel`)

  return instance.outbound(channel, uris)
}
