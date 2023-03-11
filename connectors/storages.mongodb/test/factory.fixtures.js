'use strict'

const { generate } = require('randomstring')

const Connection = jest.fn().mockImplementation(function () {})
const Storage = jest.fn().mockImplementation(function () {})

/** @type {toa.core.Locator} */ const locator = {
  name: generate(),
  namespace: generate(),
  id: generate(),
  label: generate(),
  uppercase: generate().toUpperCase(),
  hostname: jest.fn(() => generate())
}

exports.mock = { Connection, Storage }
exports.locator = locator
