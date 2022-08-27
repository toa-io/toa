'use strict'

const { Connector } = require('../src/connector')

const local = {
  link: jest.fn()
}

const discover = jest.fn(() => ({
  invoke: jest.fn(),
  link: jest.fn()
}))

const annexes = [new Connector(), new Connector()]

exports.local = local
exports.discover = discover
exports.annexes = annexes
