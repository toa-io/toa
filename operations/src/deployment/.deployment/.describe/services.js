'use strict'

const { addVariables } = require('./variables')

function services (services, variables, probe, ingress) {
  for (const service of services) {
    addVariables(service, variables)

    if (service.probe === false)
      delete service.probe
    else if (service.probe === undefined && probe !== undefined && probe !== false)
      service.probe = probe
    else if (service.probe === undefined && probe === false && service.ingress !== undefined)
      // Kubernetes routes to a pod it believes ready. A service that answers an ingress and
      // has no probe is reported ready before it can serve, and an omission would look like
      // a decision — so state it: `probe: false` says the service is meant to run without one.
      throw new Error(`Service '${service.name}' would deploy without a readiness probe: ` +
        'it declares none, and the probe that would supply one is disabled. Enable the ' +
        "telemetry ready probe, or declare `probe: false` on the service to run without one.")

    if (service.ingress !== undefined)
      expose(service, ingress)
  }
}

/**
 * A service declares only its own intent — a path, a port. Where that lands is
 * the context's business, so everything else comes from its `ingress` section.
 * What the service did declare wins.
 */
function expose (service, ingress = {}) {
  const declared = Object.fromEntries(
    Object.entries(service.ingress).filter(([, value]) => value !== undefined))

  service.ingress = Object.assign({}, ingress, declared)

  if (service.ingress.hosts === undefined)
    throw new Error(`Service '${service.name}' declares an ingress, but no hosts are defined. ` +
      "Declare them in the context's 'ingress' section.")

  if (service.port === undefined)
    throw new Error(`Service '${service.name}' declares an ingress, but no port.`)
}

exports.services = services
