/**
 * What a workload takes on by running services in its own pod: their variables, the ports
 * they bind, and a readiness probe answered by one of them rather than by the workload.
 *
 * What it does *not* take on is how they are reached. A composition-hosted service keeps
 * its own Service and Ingress — only the pods behind them change — so the ingress union
 * belongs to `mono`, the one workload that fronts every service under a single name.
 *
 * @param {object} workload
 * @param {toa.deployment.dependency.Service[]} services
 * @param {toa.deployment.Dependency} dependency
 */
export function fold (workload, services, dependency) {
  workload.variables ??= []

  for (const service of services) {
    if (service.variables !== undefined)
      for (const variable of service.variables)
        if (!workload.variables.some((item) => item.name === variable.name))
          workload.variables.push(variable)

    // every declared port is bound by the single process, none is primary
    if (service.port !== undefined)
      (workload.backends ??= []).push({ port: service.port, path: service.ingress?.path ?? '/' })

    if (service.probe !== undefined && service.probe !== false)
      workload.probe = service.probe
  }

  if (workload.probe === undefined && dependency.probe !== undefined && dependency.probe !== false)
    workload.probe = dependency.probe

  // the more specific prefix must come first, whatever the controller's tie-break
  workload.backends?.sort((a, b) => b.path.length - a.path.length)
}
