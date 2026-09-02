'use strict'

const { mock } = require('node:test')

const { generate } = require('randomstring')

// noinspection JSCheckFunctionSignatures
const events = [0, 1, 2].map((index) => ({
  emit: mock.fn(async (state) => ({ ...state, event: index }))
}))

const event = {
  origin: { [generate()]: generate() },
  state: { [generate()]: generate() }
}

exports.events = events
exports.event = event
