'use strict'

const original = jest.requireActual('../src/state')

const reset = jest.fn(() => original.state.reset())
const state = { ...original.state, reset }

module.exports = { state }
