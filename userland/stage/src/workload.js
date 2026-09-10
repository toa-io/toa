import * as boot from '@toa.io/boot'
import { state } from './state.js'

/**
 * A process, as `toa compose` runs one: the composition, and whatever the extensions keep in
 * a process beside it — the readiness probe.
 *
 * `composition` is the other way to boot the same components, and the difference is the point
 * of this one: what belongs to a process is here and not there.
 */
export const workload = async (paths, options) => {
  const workload = new boot.Workload(async () => await boot.composition(paths, options))

  await workload.connect()

  state.workloads.push(workload)

  return workload
}
