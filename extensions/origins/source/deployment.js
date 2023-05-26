'use strict'

const { merge } = require('@toa.io/generic')
const schemas = require('./schemas')
const protocols = require('./protocols')
const create = require('./.deployment')
const credentials = require('./.credentials')

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.origins.Annotations} annotations
 * @returns {toa.deployment.dependency.Declaration}
 */
function deployment (instances, annotations = {}) {
  validate(annotations)

  const uris = create.uris(instances, annotations)
  const variables = { ...uris }

  protocols.reduce((variables, provider) => {
    const specifics = provider.deployment?.(instances)

    return merge(variables, specifics)
  }, variables)

  return { variables }
}

/**
 * @param {toa.origins.Annotations} annotations
 * @return {void}
 */
function validate (annotations) {
  schemas.annotations.validate(annotations)

  for (const component of Object.values(annotations)) {
    Object.values(component).forEach(credentials.check)
  }
}

exports.deployment = deployment
