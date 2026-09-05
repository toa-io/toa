import { Outbox } from '@toa.io/core'

import * as boot from './index.js'

/**
 * A component with no declared events has nothing to publish and therefore no outbox — the
 * static check that keeps the common case free of a transaction.
 *
 * @param {toa.norm.Component} manifest
 * @param {import('@toa.io/core/types').storages.Storage} [storage]
 * @param {import('@toa.io/core').Emission} [emission]
 */
export const outbox = (manifest, storage, emission) => {
  if (emission === undefined) return

  return new Outbox(emission, storage, boot.atomicity(manifest.locator.id), {})
}
