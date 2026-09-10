import { Gate } from '@toa.io/core'

import * as boot from './index.js'

/**
 * What the process hosting an extension provides to it. The counterpart of a component's
 * context: an extension reaches the core through this and through nothing else.
 *
 * `gate` and `halt` belong to the process. A host made without one still answers both — a
 * composition booted on its own, by a scenario or by `toa call`, is not a process and cannot
 * be halted, so its gates are ones nothing ever takes down.
 *
 * @param {import('./workload.js').Workload} [workload]
 * @returns {import('@toa.io/core/types').extensions.Host}
 */
export const host = (workload) => ({
  remote: boot.remote,
  broadcast: boot.bindings.broadcast,
  composition: boot.composition,
  receive: boot.receive,
  atom: boot.atomicity,
  outbound: boot.bindings.outbound,
  inbound: boot.bindings.inbound,
  gate: (build) => workload?.gate(build) ?? new Gate(build),
  halt: (seconds) => workload?.halt(seconds)
})
