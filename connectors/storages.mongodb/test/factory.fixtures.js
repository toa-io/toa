'use strict'

const { generate } = require('randomstring')

const Connection = jest.fn().mockImplementation(function () {})
const Storage = jest.fn().mockImplementation(function () {})

const locator = {
  namespace: generate(),
  name: generate(),
  id: generate(),
  label: generate(),
  host: jest.fn(() => generate())
}

exports.mock = { Connection, Storage }
exports.locator = locator
