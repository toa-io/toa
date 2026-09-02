'use strict'

const { mock } = require('node:test')

// this module defines the replacement, so it still sees the real one
const original = require('../src/state')

const reset = mock.fn(() => original.state.reset())
const state = { ...original.state, reset }

module.exports = { state }
