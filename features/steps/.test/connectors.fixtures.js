'use strict'

const { generate } = require('randomstring')

const connector = () => {
  return { connect: jest.fn() }
}

const boot = {
  component: jest.fn(() => generate()),
  runtime: jest.fn(() => connector())
}

exports.mock = { boot }
