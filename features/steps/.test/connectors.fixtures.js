'use strict'

const { generate } = require('randomstring')

const connector = (extension) => {
  return Object.assign({ connect: jest.fn(), disconnect: jest.fn() }, extension)
}

const boot = {
  component: jest.fn(() => connector()),
  runtime: jest.fn(() => connector()),
  composition: jest.fn(() => connector()),
  remote: jest.fn(() => connector({ invoke: jest.fn() }))
}

exports.mock = { boot }
