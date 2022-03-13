'use strict'

const deployment = () => {
  const fullname = 'rabbitmq'

  // TODO: provide passwords as secrets for component containers
  const user = 'user'
  const password = 'password'
  const erlangCookie = 'cookie'

  const charts = [{
    declaration: {
      name: 'rabbitmq',
      version: '8.24.3',
      repository: 'https://charts.bitnami.com/bitnami'
    },
    values: {
      fullnameOverride: fullname,
      auth: {
        user,
        password,
        erlangCookie
      }
    }
  }]

  return { charts }
}

exports.deployment = deployment
