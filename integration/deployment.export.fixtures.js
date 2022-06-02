'use strict'

const chart = {
  apiVersion: 'v2',
  type: 'application',
  name: 'dummies',
  description: 'Integration tests dummies context',
  version: '0.0.0',
  appVersion: '0.0.0',
  dependencies: expect.arrayContaining([
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '12.0.0',
      alias: 'storage-messages'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '12.0.0',
      alias: 'storage-stats'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '12.0.0',
      alias: 'storage-credits'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '12.0.0',
      alias: 'storage-dummies'
    },
    {
      name: 'rabbitmq',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '9.0.0'
    }
  ])
}

const values = {
  components: expect.arrayContaining([
    'dummies-a',
    'credits-balance',
    'messages-messages',
    'stats-stats'
  ]),
  compositions: expect.arrayContaining([
    {
      name: 'credits-balance',
      components: ['credits-balance'],
      image: expect.stringMatching(/^[^/]+\/dummies\/composition-credits-balance:[a-z\d]+/)
    },
    {
      name: 'dummies-a',
      components: ['dummies-a'],
      image: expect.stringMatching(/^[^/]+\/dummies\/composition-dummies-a:[a-z\d]+/)
    },
    {
      name: 'messages',
      components: ['messages-messages', 'stats-stats'],
      image: expect.stringMatching(/^[^/]+\/dummies\/composition-messages:[a-z\d]+/)
    }
  ]),
  services: expect.arrayContaining([
    {
      name: 'resources-exposition',
      image: expect.stringMatching(/^[^/]+\/dummies\/service-resources-exposition:[a-z\d]+/),
      port: 8000,
      ingress: {
        host: expect.any(String),
        class: expect.any(String),
        annotations: expect.any(Object)
      }
    }
  ]),
  'storage-messages': {
    architecture: 'standalone',
    fullnameOverride: 'storage-messages',
    auth: {
      usernames: ['user'],
      passwords: ['password'],
      databases: ['messages']
    }
  },
  'storage-stats': {
    architecture: 'standalone',
    fullnameOverride: 'storage-stats',
    auth: {
      usernames: ['user'],
      passwords: ['password'],
      databases: ['stats']
    }
  },
  'storage-credits': {
    architecture: 'standalone',
    fullnameOverride: 'storage-credits',
    auth: {
      usernames: ['user'],
      passwords: ['password'],
      databases: ['credits']
    }
  },
  'storage-dummies': {
    architecture: 'standalone',
    fullnameOverride: 'stoarage-dummies',
    auth: {
      usernames: ['user'],
      passwords: ['password'],
      databases: ['dummies']
    }
  },
  rabbitmq: {
    fullnameOverride: 'rabbitmq',
    auth: {
      username: expect.any(String),
      password: expect.any(String),
      erlangCookie: expect.any(String)
    }
  }
}

exports.chart = chart
exports.values = values
