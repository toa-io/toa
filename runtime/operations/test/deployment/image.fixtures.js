'use strict'

const { newid, random, repeat } = require('@toa.io/gears')
const { join } = require('node:path')
const { generate } = require('randomstring')

const mock = {
  execa: jest.fn(() => ({ stdout: { pipe: jest.fn() } }))
}

const composition = {
  name: generate(),
  components: repeat(() => ({ locator: { id: newid() }, version: generate() }), random(5) + 5)
}

const context = {
  registry: `registry-${newid()}:${random(999) + 5000}`,
  runtime: {
    version: `${random(9)}.${random(9)}.${random(20)}`
  }
}

const DOCKERFILE = join(__dirname, '../src/images/Dockerfile')

exports.mock = mock
exports.composition = composition
exports.context = context
exports.DOCKERFILE = DOCKERFILE
