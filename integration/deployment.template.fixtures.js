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
    name: 'resources-gateway',
    port: 8000
  }
]

exports.scope = scope
exports.compositions = compositions
exports.components = components
exports.services = services
