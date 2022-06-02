'use strict'

const { PORT } = require('./constants')

/**
 * @type {toa.operations.deployment.dependency.Constructor}
 * @param {object[]} declarations
 * @param {toa.extensions.resources.Annotations} annotations
 */
const deployment = (declarations, annotations) => {
  const group = 'resources'
  const name = 'exposition'
  const version = require('../package.json').version
  const port = PORT
  const ingress = annotations

  /** @type {toa.operations.deployment.dependency.Service} */
  const exposition = { group, name, version, port, ingress }

  return { services: [exposition] }
}

exports.deployment = deployment
