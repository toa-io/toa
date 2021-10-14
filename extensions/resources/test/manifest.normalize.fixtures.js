'use strict'

const manifest = {
  operations: {
    one: {
      type: 'transition',
      query: false
    },
    two: {
      type: 'observation'
    },
    three: {
      type: 'observation'
    }
  }
}

const resources = {
  '/top': {
    operations: ['one'],
    '/nested': {
      operations: ['two'],
      '/deeper': {
        operations: [{
          operation: 'three'
        }]
      }
    }
  }
}

exports.manifest = manifest
exports.resources = resources
