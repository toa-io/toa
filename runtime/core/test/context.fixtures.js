'use strict'

const { mock } = require('node:test')

const { Connector } = require('../src/connector')

const local = {
  link: mock.fn()
}

const discover = mock.fn(() => ({
  invoke: mock.fn(),
  link: mock.fn()
}))

const aspects = [new Connector(), new Connector()]

exports.local = local
exports.discover = discover
exports.aspects = aspects
