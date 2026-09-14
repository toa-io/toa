import { console } from 'openspan'
import { Remote } from '@toa.io/core'
import { remap } from '@toa.io/generic'

import * as boot from './index.js'

/**
 * @param {import('@toa.io/core').Locator} locator
 * @param {import('@toa.io/core/types').Source} [source] the origin stamped on every call made through this remote
 * @param {{ manifest?: toa.norm.Component, version?: string }} [options]
 *   `manifest` skips discovery where it is already known; `version` is which version of the
 *   component answers, where the caller knows one — the gateway, from the branch it merged.
 *   Absent, the map this process was given says, and absent that too, whichever version answers.
 */
export const remote = async (locator, source, options = {}) => {
  let { manifest } = options
  let discovery

  if (manifest === undefined) {
    const version = options.version ?? (await boot.map.version(locator.id))

    console.debug('Lookup', { locator: locator.id, version })

    discovery = await boot.discovery.discovery()
    manifest = await discovery.lookup(locator, version)
  }

  // a call binds its consumers, which are loaded rather than required
  const calls =
    manifest.operations === undefined
      ? {}
      : await settle(
          remap(manifest.operations, (definition, endpoint) =>
            boot.call(locator, endpoint, definition, manifest.entity, source)
          )
        )

  const remote = new Remote(locator, calls)

  // ensure discovery shutdown
  if (discovery !== undefined) remote.depends(discovery)

  return remote
}

/** An object whose values are promises, as an object of what they resolve to. */
async function settle(object) {
  const entries = Object.entries(object)
  const values = await Promise.all(entries.map(([, promise]) => promise))

  return Object.fromEntries(entries.map(([key], index) => [key, values[index]]))
}
