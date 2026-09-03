import * as boot from './index.js'

/**
 * What the process hosting an extension provides to it. The counterpart of a component's
 * context: an extension reaches the core through this and through nothing else.
 *
 * @returns {toa.core.extensions.Host}
 */
export const host = () => ({
  remote: boot.remote,
  broadcast: boot.bindings.broadcast,
  composition: boot.composition,
  receive: boot.receive,
  atom: boot.atomicity
})
