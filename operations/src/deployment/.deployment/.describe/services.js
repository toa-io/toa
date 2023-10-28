'use strict'

const { addVariables } = require('./variables')

function services (services, variables) {
  for (const service of services) {
    addVariables(service, variables)
  }
}

exports.services = services
