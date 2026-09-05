import { console } from 'openspan'
import { Remote } from '@toa.io/core'
import { remap } from '@toa.io/generic'

import * as boot from './index.js'

/**
 * @param {import('@toa.io/core').Locator} locator
 * @param {import('@toa.io/core/types').Source} [source] the origin stamped on every call made through this remote
 * @param {toa.norm.Component} [manifest] skips discovery when the manifest is already known
 */
export const remote = async (locator, source, manifest) => {
  let discovery

  if (manifest === undefined) {
    console.debug('Lookup', { locator: locator.id })

    discovery = await boot.discovery.discovery(locator)
    manifest = await discovery.lookup(locator)
  }

  // a call binds its consumers, which are loaded rather than required
  const calls = manifest.operations === undefined
    ? {}
    : await settle(remap(manifest.operations,
      (definition, endpoint) => boot.call(locator, endpoint, definition, manifest.entity, source)))

  const remote = new Remote(locator, calls)

  // ensure discovery shutdown
  if (discovery !== undefined)
    remote.depends(discovery)

  return remote
}

/** An object whose values are promises, as an object of what they resolve to. */
async function settle (object) {
  const entries = Object.entries(object)
  const values = await Promise.all(entries.map(([, promise]) => promise))

  return Object.fromEntries(entries.map(([key], index) => [key, values[index]]))
}
