'use strict'

const manifest = {
  operations: {
    one: {
      type: 'transition',
      subject: 'object',
      query: false
    },
    two: {
      type: 'observation',
      subject: 'objects'
    },
    three: {
      type: 'observation',
      subject: 'objects'
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
