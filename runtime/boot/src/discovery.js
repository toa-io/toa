import { Discovery, Exposition } from '@toa.io/core'

import * as boot from './index.js'

let promise
let instance = null

/**
 * The process's discovery, for as long as it is connected.
 *
 * A disconnected one is replaced rather than reused. A lookup becomes a dependency of the
 * discovery that made it and nothing takes one back, so an instance carried across a
 * disconnection would reconnect every call it has ever made beside the ones the composition now
 * booting asks for — and every disconnection after that would walk all of them again.
 */
export const discovery = async () => {
  while (true) {
    if (instance === null) {
      instance = new Discovery(lookup)
      promise = instance.connect()
    }

    const current = instance

    await promise

    if (current.connected) return current

    // whoever replaced it first wins, and the loop reads what they left
    if (instance === current) instance = null
  }
}

const lookup = async (locator, version) => {
  const call = await boot.call(locator, endpoint(version), { bindings: BINDINGS })

  await call.connect()

  return call
}

/**
 * Where a lookup of a named version of a component is answered. Absent a version, the name every
 * version of it answers on, which is what a caller with no map asks.
 *
 * @param {string} [version]
 * @returns {string}
 */
export const endpoint = (version) =>
  version === undefined ? ENDPOINT : ENDPOINT + SEPARATOR + version

/**
 * Both names, always: the versioned one is what a caller that knows which version it wants asks,
 * and the shared one is what everything else asks — a caller outside the deployment, a process of
 * a runtime that has never heard of this.
 */
export const expose = async (manifest) => {
  const exposition = new Exposition(manifest.locator, manifest)
  const operations = {
    [ENDPOINT]: { bindings: BINDINGS },
    [endpoint(manifest.version)]: { bindings: BINDINGS }
  }
  const { local, other } = await boot.bindings.produce(exposition, operations)
  const producers = local.concat(other)

  await Promise.all(producers.map((producer) => producer.connect()))

  return producers
}

const BINDINGS = ['@toa.io/bindings.amqp']
const ENDPOINT = '.lookup'

/** the runtime's own, as `..tasks` and `..instances` are */
const SEPARATOR = '..'
