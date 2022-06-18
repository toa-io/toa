'use strict'

/**
 * @param {toa.formation.component.Brief[]} components
 * @param {string} annotations
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const deployment = (components, annotations) => {
  if (annotations !== undefined) return proxy(annotations)
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
        username,
        password,
        erlangCookie
      }
    }
  }

  return { references: [rabbitmq] }
}

/**
 * @param {string} target
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const proxy = (target) => {
  return { proxies: [{ name: 'rabbitmq', target }] }
}

exports.deployment = deployment
