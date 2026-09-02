import { Outbox } from '@toa.io/core'

import * as boot from './index.js'

/**
 * A component with no declared events has nothing to publish and therefore no outbox — the
 * static check that keeps the common case free of a transaction.
 *
 * @param {toa.norm.Component} manifest
 * @param {toa.core.Storage} [storage]
 * @param {toa.core.Emission} [emission]
 */
const outbox = (manifest, storage, emission) => {
  if (emission === undefined) return

  return new Outbox(emission, storage, boot.atomicity(manifest.locator.id), {})
}

export { outbox }
