'use strict'

function services (services, variables) {
  for (const service of services) {
    service.variables = variables.global
  }
}

exports.services = services
