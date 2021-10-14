'use strict'

const definition = {
  '/': {
    operations: ['find'],
    '/:id': {
      operations: ['observe'],
      '/segment': {
        operations: ['delete']
      }
    },
    '/segment/:param': {
      operations: ['transit']
    }
  },
  '/sibling': {
    operations: ['update']
  }
}

exports.definition = definition
