import { Outbox } from '@toa.io/core'

import * as boot from './index.js'

/**
 * A component with nothing to publish to has no outbox — the static check that keeps the
 * common case free of a transaction. Its own events are one destination; an extension may
 * contribute others, and a component that declares no event at all has an outbox where one of
 * those is there.
 *
 * @param {toa.norm.Component} manifest
 * @param {import('@toa.io/core/types').storages.Storage} [storage]
 * @param {import('@toa.io/core').Emission} [emission]
 * @param {import('@toa.io/core/types').outbox.Destination[]} [contributed]
 */
export const outbox = (manifest, storage, emission, contributed = []) => {
  const destinations = emission === undefined ? contributed : [emission, ...contributed]

  if (destinations.length === 0) return

  return new Outbox(destinations, storage, boot.atomicity(manifest.locator.id), {})
}
