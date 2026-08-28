'use strict'

const { addVariables } = require('./variables')

function services (services, variables, probe, ingress) {
  for (const service of services) {
    addVariables(service, variables)

    if (service.probe === false)
      delete service.probe
    else if (service.probe === undefined && probe !== undefined && probe !== false)
      service.probe = probe

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
