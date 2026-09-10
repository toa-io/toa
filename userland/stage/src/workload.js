import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import * as boot from '@toa.io/boot'
import { Connector } from '@toa.io/core'
import { shortcuts } from '@toa.io/norm'
import { state } from './state.js'

// a shortcut resolves to a package name, which is not a path
const require = createRequire(import.meta.url)

/** The services, made against this process rather than against no process. */
const create = async (references, workload) => {
  const services = []

  for (const reference of references) {
    const path = shortcuts.resolve(reference)
    const { Factory } = await import(pathToFileURL(require.resolve(path)).href)
    const service = await new Factory(boot.host(workload)).service()

    if (service !== null) services.push(service)
  }

  return services
}

/**
 * A process, as `toa compose` runs one: the composition behind a gate, whatever services it
 * was told to run beside it, and whatever the extensions keep in a process — the readiness
 * probe, the ear a halt arrives at.
 *
 * `composition` is the other way to boot the same components, and the difference is the point
 * of this one: what belongs to a process is here and not there. So is what a halt takes,
 * which is why a service that has to be halted is run from here rather than staged apart.
 */
export const workload = async (paths, options, services = []) => {
  const workload = new boot.Workload(async (workload) => {
    const composition = workload.gate(
      async () => await boot.composition(paths, options)
    )

    if (services.length === 0) return composition

    const root = new Connector()

    root.depends([composition, ...(await create(services, workload))])

    return root
  })

  await workload.connect()

  state.workloads.push(workload)

  return workload
}
