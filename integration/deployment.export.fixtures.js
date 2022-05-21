'use strict'

const chart = {
  apiVersion: 'v2',
  type: 'application',
  name: 'dummies',
  description: 'Integration tests context',
  version: '0.0.0',
  appVersion: '0.0.0',
  dependencies: expect.arrayContaining([
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '12.0.0',
      alias: 'messages-mongodb'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '12.0.0',
      alias: 'stats-mongodb'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '12.0.0',
      alias: 'credits-mongodb'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '12.0.0',
      alias: 'dummies-mongodb'
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
      name: 'resources-gateway',
      image: expect.stringMatching(/^[^/]+\/dummies\/service-resources-gateway:[a-z\d]+/),
      port: 8000
    }
  ]),
  'messages-mongodb': {
    architecture: 'standalone',
    fullnameOverride: 'messages-mongodb',
    auth: {
      usernames: ['user'],
      passwords: ['password'],
      databases: ['messages']
    }
  },
  'stats-mongodb': {
    architecture: 'standalone',
    fullnameOverride: 'stats-mongodb',
    auth: {
      usernames: ['user'],
      passwords: ['password'],
      databases: ['stats']
    }
  },
  'credits-mongodb': {
    architecture: 'standalone',
    fullnameOverride: 'credits-mongodb',
    auth: {
      usernames: ['user'],
      passwords: ['password'],
      databases: ['credits']
    }
  },
  'dummies-mongodb': {
    architecture: 'standalone',
    fullnameOverride: 'dummies-mongodb',
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
