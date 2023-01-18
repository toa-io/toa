'use strict'

const { generate } = require('randomstring')

const connector = () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  link: jest.fn()
})

const manifest = jest.fn(async () => generate())
const component = jest.fn(async () => connector())
const composition = jest.fn(async () => connector())
const remote = jest.fn(async () => connector())

module.exports = { manifest, component, composition, remote }
