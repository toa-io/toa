'use strict'

const { newid, random } = require('@toa.io/gears')
const { join } = require('node:path')

const mock = {
  execa: jest.fn(() => ({ stdout: { pipe: jest.fn() } }))
}

const manifest = {
  domain: 'domain' + newid(),
  name: 'component' + newid(),
  version: '0.0.' + random(9),
  path: newid()
}

const registry = `registry-${newid()}:${random(999) + 5000}`

const DOCKERFILE = join(__dirname, '../src/images/Dockerfile')

exports.mock = mock
exports.manifest = manifest
exports.registry = registry
exports.DOCKERFILE = DOCKERFILE
