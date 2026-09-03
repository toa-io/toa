export const merge = (dependencies) => {
  /** @type {toa.deployment.dependency.Reference[]} */
  const references = []

  /** @type {toa.deployment.Service[]} */
  const services = []

  /** @type {toa.deployment.dependency.Proxy[]} */
  const proxies = []

  /** @type {toa.deployment.dependency.Variables} */
  const variables = {}

  /** event labels consumed by something other than a component's own receivers */
  const events = []

  const mounts = {}

  /** @type {toa.deployment.dependency.Probe | false | undefined} */
  let probe

  for (const dependency of dependencies) {
    if (dependency.references !== undefined) references.push(...dependency.references)
    if (dependency.services !== undefined) services.push(...dependency.services)
    if (dependency.proxies !== undefined) proxies.push(...dependency.proxies)
    if (dependency.variables !== undefined) append(variables, dependency.variables)
    if (dependency.events !== undefined) events.push(...dependency.events)
    if (dependency.mounts !== undefined) append(mounts, dependency.mounts)
    if (dependency.probe !== undefined) probe = dependency.probe
  }

  reserve(services, probe)

  return { references, services, proxies, variables, mounts, events, probe }
}

/**
 * A workload that hosts services puts them in one process — `mono`, a composition that
 * declares them, a local run — so within one a port may be claimed once and only once.
 * A service deploying on its own is a pod of its own, and shares a port with nobody.
 */
const reserve = (services, probe) => {
  /** @type {Map<string, Map<number, string>>} */
  const workloads = new Map()

  for (const service of services)
    // a service several compositions run binds its ports in each of their pods
    for (const workload of service.workload ?? [service.name]) {
      let claimed = workloads.get(workload)

      if (claimed === undefined) {
        claimed = new Map()

        if (probe !== undefined && probe !== false)
          claimed.set(probe.port, 'the readiness probe')

        workloads.set(workload, claimed)
      }

      for (const [port, claimant] of ports(service)) {
        const conflicting = claimed.get(port)

        if (conflicting !== undefined)
          throw new Error(`Port ${port} is claimed by both ${conflicting} and ${claimant}` +
            (service.workload === undefined ? '' : ` in '${workload}'`))

        claimed.set(port, claimant)
      }
    }
}

function * ports (service) {
  // every service reaching here is named the way it is deployed, `<group>-<name>`
  const name = `'${service.name}'`

  if (service.port !== undefined)
    yield [service.port, name]

  if (service.probe !== undefined && service.probe !== false && service.probe.port !== service.port)
    yield [service.probe.port, `the readiness probe of ${name}`]
}

const append = (merged, variables) => {
  for (const [component, vars] of Object.entries(variables)) {
    if (merged[component] === undefined) merged[component] = []

    merged[component].push(...vars)
  }
}
