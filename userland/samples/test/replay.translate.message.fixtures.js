'use strict'

const { generate } = require('randomstring')
const { flip } = require('@toa.io/generic')

/** @type {toa.samples.Message} */
const message = {
  title: generate(),
  payload: { [generate()]: generate() },
  input: generate(),
  query: { id: generate() },
  request: {
    current: {
      id: generate()
    }
  }
}

const autonomous = flip()
const component = generate()

exports.message = message
exports.autonomous = autonomous
exports.component = component
