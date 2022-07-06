'use strict'

/**
 * @type {toa.operations.deployment.dependency.Constructor}
 */
const deployment = (instances, annotations) => {
  if (annotations !== undefined) return proxies(instances, annotations)
  else return reference()
}

/**
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const reference = () => {
  const fullname = 'rabbitmq'

  // TODO: provide passwords as secrets for component containers
  const username = 'user'
  const password = 'password'
  const erlangCookie = 'cookie'

  const rabbitmq = {
    name: 'rabbitmq',
    version: '9.0.0',
    repository: 'https://charts.bitnami.com/bitnami',
    values: {
      fullnameOverride: fullname,
      auth: {
        username, password, erlangCookie
      }
    }
  }

  return { references: [rabbitmq] }
}

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.annotations.proxy.Declaration | string} annotation
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const proxies = (instances, annotation) => {
  const proxies = instances.map((instance) => ({
    name: instance.locator.label,
    target: annotation[instance.locator.id] || annotation.default
  }))

  return { proxies }
}

exports.deployment = deployment
