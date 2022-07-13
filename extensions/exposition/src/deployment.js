'use strict'

const { PORT } = require('./constants')

/**
 * @param {toa.norm.context.dependencies.Instance[]} components
 * @param {toa.extensions.exposition.Annotations} annotations
 * @type {toa.deployment.dependency.Constructor}
 */
const deployment = (components, annotations) => {
  const group = 'exposition'
  const name = 'resources'
  const version = require('../package.json').version
  const port = PORT
  const ingress = annotations

  /** @type {toa.deployment.dependency.Service} */
  const exposition = { group, name, version, port, ingress }

  return { services: [exposition] }
}

exports.deployment = deployment
