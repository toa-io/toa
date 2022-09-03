'use strict'

const PRIMITIVES = ['string', 'number', 'integer', 'boolean', 'object', 'array']

const SHORTCUTS = {
  id: {
    $ref: 'https://schemas.toa.io/0.0.0/definitions#/definitions/id'
  }
}

const EXPRESSION = /^\/(?<expression>.+)\/$/

exports.EXPRESSION = EXPRESSION
exports.PRIMITIVES = PRIMITIVES
exports.SHORTCUTS = SHORTCUTS
