import { Gate } from '@toa.io/core'

import * as boot from './index.js'

/**
 * @param {import('./workload.js').Workload} [workload] the process, where there is one
 *
 * What the process hosting an extension provides to it. The counterpart of a component's
 * context: an extension reaches the core through this and through nothing else.
 *
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

  // a composition booted outside a process — by a scenario, by `toa call` — has no workload, so
  // its gates are ones nothing ever takes down and a halt asked of it is nobody's to perform
  gate: (build) => workload?.gate(build) ?? new Gate(build),
  quiesce: async () => await workload?.quiesce(),
  cancel: async () => await workload?.cancel(),
  stop: (seconds) => workload?.stop(seconds)
})
