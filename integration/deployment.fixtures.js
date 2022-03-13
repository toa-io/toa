'use strict'

const chart = {
  apiVersion: 'v2',
  type: 'application',
  name: 'dummies',
  description: 'Integration tests context',
  version: '0.0.0',
  appVersion: '0.0.0',
  dependencies: [
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '10.29.2',
      alias: 'messages-mongodb'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '10.29.2',
      alias: 'stats-mongodb'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '10.29.2',
      alias: 'credits-mongodb'
    },
    {
      name: 'mongodb',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '10.29.2',
      alias: 'dummies-mongodb'
    },
    {
      name: 'rabbitmq',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '8.24.3'
    },
    {
      name: 'nginx-ingress-controller',
      repository: 'https://charts.bitnami.com/bitnami',
      version: '9.1.5'
    }
  ]
}

const values = {
  components: [
    'dummies-a',
    'credits-balance',
    'messages-messages',
    'stats-stats'
  ],
  compositions: [
    {
      name: 'credits-balance',
      components: ['credits-balance'],
      image: expect.stringMatching(/^localhost:5000\/credits-balance:[a-z0-9]+/)
    },
    {
      name: 'dummies-a',
      components: ['dummies-a'],
      image: expect.stringMatching(/^localhost:5000\/dummies-a:[a-z0-9]+/)
    },
    {
      name: 'messages',
      components: ['messages-messages', 'stats-stats'],
      image: expect.stringMatching(/^localhost:5000\/messages:[a-z0-9]+/)
    }
  ],
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
      user: expect.any(String),
      password: expect.any(String),
      erlangCookie: expect.any(String)
    }
  }
}

exports.chart = chart
exports.values = values
