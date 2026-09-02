'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const connector = () => ({
  connect: mock.fn(),
  disconnect: mock.fn(),
  link: mock.fn()
})

const manifest = mock.fn(async () => generate())
const component = mock.fn(async () => connector())
const composition = mock.fn(async () => connector())
const remote = mock.fn(async () => connector())

module.exports = { manifest, component, composition, remote }
