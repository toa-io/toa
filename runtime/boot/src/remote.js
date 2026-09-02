import { console } from 'openspan'
import { Remote } from '@toa.io/core'
import { remap } from '@toa.io/generic'

import * as boot from './index.js'

/**
 * @param {toa.core.Locator} locator
 * @param {toa.core.Source} [source] the origin stamped on every call made through this remote
 * @param {toa.norm.Component} [manifest] skips discovery when the manifest is already known
 */
const remote = async (locator, source, manifest) => {
  let discovery

  if (manifest === undefined) {
    console.debug('Lookup', { locator: locator.id })

    discovery = await boot.discovery.discovery(locator)
    manifest = await discovery.lookup(locator)
  }

  const calls = manifest.operations === undefined
    ? {}
    : remap(manifest.operations,
      (definition, endpoint) => boot.call(locator, endpoint, definition, manifest.entity, source))

  const remote = new Remote(locator, calls)

  // ensure discovery shutdown
  if (discovery !== undefined)
    remote.depends(discovery)

  return remote
}

export { remote }
