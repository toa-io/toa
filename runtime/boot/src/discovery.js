import { Discovery, Exposition } from '@toa.io/core'

import * as boot from './index.js'

let promise
let instance = null

const discovery = async () => {
  if (instance === null) {
    instance = new Discovery(lookup)
    promise = instance.connect()
  }

  await promise

  return instance
}

const lookup = async (locator) => {
  const call = await boot.call(locator, ENDPOINT, { bindings: BINDINGS })

  await call.connect()

  return call
}

const expose = async (manifest) => {
  const exposition = new Exposition(manifest.locator, manifest)
  const operations = { [ENDPOINT]: { bindings: BINDINGS } }
  const { local, other } = await boot.bindings.produce(exposition, operations)
  const producers = local.concat(other)

  await Promise.all(producers.map((producer) => producer.connect()))

  return producers
}

const BINDINGS = ['@toa.io/bindings.amqp']
const ENDPOINT = '.lookup'

export { discovery, expose }
