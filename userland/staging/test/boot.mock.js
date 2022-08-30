'use strict'

const { generate } = require('randomstring')

const manifest = jest.fn(() => generate())

const component = jest.fn(() => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  link: jest.fn()
}))

const boot = { manifest, component }

exports.mock = { boot }
