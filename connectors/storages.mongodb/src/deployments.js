'use strict'

const deployments = (values) => {
  const domains = new Set(values.map((value) => value.domain))

  return [...domains].map(deployment)
}

const deployment = (domain) => {
  const alias = domain + '-mongodb'

  // TODO: credentials management
  const usernames = ['user']
  const passwords = ['password']
  const databases = [domain]

  return {
    chart: {
      name: 'mongodb',
      version: '10.29.2',
      repository: 'https://charts.bitnami.com/bitnami',
      alias
    },
    values: {
      architecture: 'standalone',
      fullnameOverride: alias,
      auth: {
        usernames,
        passwords,
        databases
      }
    }
  }
}

exports.deployments = deployments
