'use strict'

const { addVariables } = require('./variables')

function services (services, variables, probe) {
  for (const service of services) {
    addVariables(service, variables)

    if (service.probe === false)
      delete service.probe
    else if (service.probe === undefined && probe !== undefined && probe !== false)
      service.probe = probe
  }
}

exports.services = services
