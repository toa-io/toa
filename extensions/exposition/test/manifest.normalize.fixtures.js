'use strict'

const manifest = {
  operations: {
    one: {
      type: 'transition',
      scope: 'object',
      query: false
    },
    two: {
      type: 'observation',
      scope: 'objects'
    },
    three: {
      type: 'observation',
      scope: 'objects'
    }
  }
}

const resources = {
  '/': ['one', 'two'],
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
