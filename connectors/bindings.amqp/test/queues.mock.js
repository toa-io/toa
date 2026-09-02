'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

const name = mock.fn(() => generate())

exports.name = name
