'use strict'

const original = jest.requireActual('../src/binding')

const reset = jest.fn(() => original.binding.reset())
const binding = { ...original.binding, reset }

module.exports = { binding }
