'use strict'

const { merge } = require('@toa.io/generic')
const schemas = require('./schemas')
const protocols = require('./protocols')
const create = require('./.deployment')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.origins.Annotations} annotations
 * @returns {toa.deployment.dependency.Declaration}
 */
function deployment (instances, annotations = {}) {
  schemas.annotations.validate(annotations)

  const uris = create.uris(instances, annotations)
  const variables = { ...uris }

  protocols.reduce((variables, provider) => {
    const specifics = provider.deployment?.(instances)

    return merge(variables, specifics)
  }, variables)

  return { variables }
}

exports.deployment = deployment
