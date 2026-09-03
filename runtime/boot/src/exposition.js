import { Exposition, Locator } from '@toa.io/core'

import * as boot from './index.js'

export const exposition = async (manifest) => {
  const locator = new Locator('', '')
  const exposition = new Exposition(locator, manifest)
  const producers = boot.bindings.expose(exposition)

  await Promise.all(producers.map((producer) => producer.connect()))

  return producers
}
