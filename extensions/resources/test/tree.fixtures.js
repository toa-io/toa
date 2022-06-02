'use strict'

const declaration = {
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

exports.declaration = declaration
