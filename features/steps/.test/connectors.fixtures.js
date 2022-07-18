'use strict'

const { generate } = require('randomstring')

const connector = () => {
  return { connect: jest.fn() }
}

const boot = {
  component: jest.fn(() => connector()),
  runtime: jest.fn(() => connector()),
  composition: jest.fn(() => connector())
}

exports.mock = { boot }
