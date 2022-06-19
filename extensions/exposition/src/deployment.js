'use strict'

const { PORT } = require('./constants')

/**
 * @param {toa.formation.component.Brief[]} components
 * @param {toa.extensions.exposition.Annotations} annotations
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const deployment = (components, annotations) => {
  const group = 'exposition'
  const name = 'resources'
  const version = require('../package.json').version
  const port = PORT
  const ingress = annotations

  /** @type {toa.operations.deployment.dependency.Service} */
  const exposition = { group, name, version, port, ingress }

  return { services: [exposition] }
}

exports.deployment = deployment
