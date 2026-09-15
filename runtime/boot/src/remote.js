import { console } from 'openspan'
import { Remote } from '@toa.io/core'
import { remap } from '@toa.io/generic'

import * as boot from './index.js'

/**
 * @param {import('@toa.io/core').Locator} locator
 * @param {import('@toa.io/core/types').Source} [source] the origin stamped on every call made through this remote
 * @param {{ contract?: import('@toa.io/core').Contract, version?: string }} [options]
 *   `contract` is what the caller already has — a manifest of its own is one — and absent it,
 *   what the map this process was given states. `version` is which version of the component
 *   answers a lookup, where the caller knows one and the map does not state it.
 */
export const remote = async (locator, source, options = {}) => {
  let { contract } = options
  let discovery

  if (contract === undefined && options.version === undefined)
    contract = await boot.map.contract(locator.id)

  if (contract === undefined) {
    console.debug('Lookup', { locator: locator.id, version: options.version })

    discovery = await boot.discovery.discovery()
    contract = await discovery.lookup(locator, options.version)
  }

  // a call binds its consumers, which are loaded rather than required
  const calls =
    contract.operations === undefined
      ? {}
      : await settle(
          remap(contract.operations, (definition, endpoint) =>
            boot.call(locator, endpoint, definition, contract.entity, source)
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
