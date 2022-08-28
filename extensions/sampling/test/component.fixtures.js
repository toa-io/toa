'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const name = generate()
const namespace = generate()

const component = {
  locator: new Locator(name, namespace),
  invoke: jest.fn(() => ({ output: generate() })),
  link: jest.fn()
}

exports.component = component
