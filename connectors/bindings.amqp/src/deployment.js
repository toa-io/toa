'use strict'

/**
 * @type {toa.operations.deployment.dependency.Constructor}
 */
const deployment = (instances, annotations) => {
  /** @type {toa.operations.deployment.Dependency} */
  const deployment = {}

  let ref = false

  if (annotations !== undefined) {
    deployment.proxies = proxies(instances, annotations)

    if (annotations.system || annotations.default) {
      const annotation = annotations.system || annotations.default
      const system = proxy('system', annotation)

      deployment.proxies.push(system)
    } else ref = true
  } else ref = true

  if (ref) {
    const broker = reference()

    deployment.references = [broker]
  }

  return deployment
}

/**
 * @returns {toa.operations.deployment.dependency.Reference}
 */
const reference = () => {
  const fullname = 'rabbitmq'

  // TODO: provide passwords as secrets for component containers
  const username = 'user'
  const password = 'password'
  const erlangCookie = 'cookie'
  const alias = PREFIX + 'system'

  return {
    name: 'rabbitmq',
    version: '9.0.0',
    repository: 'https://charts.bitnami.com/bitnami',
    values: {
      fullnameOverride: fullname,
      auth: {
        username, password, erlangCookie
      }
    },
    alias
  }
}

/**
 * @param {toa.norm.context.dependencies.Instance[]} instances
 * @param {toa.annotations.proxy.Declaration} annotations
 * @returns {toa.operations.deployment.dependency.Proxy[]}
 */
const proxies = (instances, annotations) => {
  return instances.map((instance) => {
    const { id, label } = instance.locator
    const annotation = annotations[id] || annotations.default

    return proxy(label, annotation)
  })
}

const proxy = (label, annotation) => {
  return {
    name: PREFIX + label,
    target: annotation
  }
}

const PREFIX = 'bindings-amqp-'

exports.deployment = deployment
