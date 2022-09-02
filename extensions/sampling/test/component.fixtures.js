'use strict'

const { generate } = require('randomstring')
const { Locator } = require('@toa.io/core')

const name = generate()
const namespace = generate()
const locator = new Locator(name, namespace)

const component = {
  locator,
  invoke: jest.fn(async () => ({ output: generate() })),
  link: jest.fn()
}

exports.component = component
