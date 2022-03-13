'use strict'

const deployment = (values) => {
  const domains = new Set(values.map((value) => value.domain))

  const charts = [...domains].map(chart)

  return { charts }
}

const chart = (domain) => {
  const alias = domain + '-mongodb'

  // TODO: credentials management
  const usernames = ['user']
  const passwords = ['password']
  const databases = [domain]

  return {
    declaration: {
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

exports.deployment = deployment
