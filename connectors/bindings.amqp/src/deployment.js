'use strict'

/**
 * @returns {toa.operations.deployment.dependency.Declaration}
 */
const deployment = () => {
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

exports.deployment = deployment
