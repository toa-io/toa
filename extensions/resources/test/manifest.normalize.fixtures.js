'use strict'

const manifest = {
  operations: {
    one: {
      type: 'transition',
      subject: 'entity',
      query: false
    },
    two: {
      type: 'observation',
      subject: 'set'
    },
    three: {
      type: 'observation',
      subject: 'set'
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
