'use strict'

const scope = 'dummies'

const compositions = [
  {
    name: 'credits-balance',
    components: ['credits-balance']
  },
  {
    name: 'dummies-a',
    components: ['dummies-a']
  },
  {
    name: 'messages',
    components: ['messages-messages', 'stats-stats']
  }
]

const components = ['credits-balance', 'dummies-a', 'messages-messages', 'stats-stats']

const services = [
  {
    name: 'exposition-resources',
    port: 8000,
    ingress: {
      host: expect.any(String),
      class: expect.any(String),
      annotations: expect.any(Object)
    }
  }
]

const proxies = [
  {
    name: 'storages-mongodb-dummies-a',
    target: 'is-not-defined'
  },
  {
    name: 'storages-mongodb-credits-balance',
    target: 'is-not-defined'
  },
  {
    name: 'storages-mongodb-messages-messages',
    target: 'is-not-defined'
  },
  {
    name: 'storages-mongodb-stats-stats',
    target: 'is-not-defined'
  }
]

exports.scope = scope
exports.compositions = compositions
exports.components = components
exports.services = services
exports.proxies = proxies
