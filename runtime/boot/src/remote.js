import { Remote, contract as coreContract, exceptions } from '@toa.io/core'
import { remap } from '@toa.io/generic'

import * as boot from './index.js'

/**
 * @param {import('@toa.io/core').Locator} locator
 * @param {import('@toa.io/core/types').Source} [source] the origin stamped on every call made through this remote
 * @param {{ contract?: import('@toa.io/core').Contract }} [options]
 *   `contract` is what the caller already has — a manifest of its own is one, and so is what a
 *   tenant announced — and absent it, what the map this process was given states.
 */
export const remote = async (locator, source, options = {}) => {
  const stated = options.contract ?? (await boot.map.contract(locator.id))

  if (stated === undefined)
    throw new exceptions.UnstatedException(
      `Cannot call '${locator.id}': the component map states nothing of it. Run \`toa map\`.`
    )

  // a contract states once, or not at all, what the runtime gives every component; the calls
  // are made from the whole of it
  const contract = coreContract.restore(stated)

  // a call binds its consumers, which are loaded rather than required
  const calls =
    contract.operations === undefined
      ? {}
      : await settle(
          remap(contract.operations, (definition, endpoint) =>
            boot.call(locator, endpoint, definition, contract.entity, source)
          )
        )

  return new Remote(locator, calls)
}

/** An object whose values are promises, as an object of what they resolve to. */
async function settle(object) {
  const entries = Object.entries(object)
  const values = await Promise.all(entries.map(([, promise]) => promise))

  return Object.fromEntries(entries.map(([key], index) => [key, values[index]]))
}
