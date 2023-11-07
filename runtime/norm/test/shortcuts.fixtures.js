'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

const SHORTCUTS = {
  amqp: '@toa.io/bindings.amqp',
  mongodb: '@toa.io/storages.mongodb'
}

const object = { foo: random(), bar: { baz: generate() } }

exports.object = object
exports.SHORTCUTS = SHORTCUTS
