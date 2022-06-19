'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/gears')

const KNOWN = {
  http: '@toa.io/bindings.http',
  amqp: '@toa.io/bindings.amqp',
  mongodb: '@toa.io/storages.mongodb',
  exposition: '@toa.io/extensions.exposition',
  origins: '@toa.io/extensions.origins'
}

const object = { foo: random(), bar: { baz: generate() } }

exports.object = object
exports.KNOWN = KNOWN
