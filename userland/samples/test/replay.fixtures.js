'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/generic')

/** @type {toa.samples.Suite} */
const suite = { autonomous: true, operations: {} }

/**
 * @returns {toa.samples.Operation[]}
 */
const ops = () => {
  const samples = []

  for (let i = 0; i < random(3) + 1; i++) {
    const sample = {
      input: generate(),
      output: generate(),
      local: generate(),
      current: generate(),
      next: generate()
    }

    samples.push(sample)
  }

  return samples
}

/**
 * @returns {toa.samples.Message[]}
 */
const msgs = () => {
  /** @type {toa.samples.Message[]} */
  const samples = []

  for (let i = 0; i < random(3) + 1; i++) {
    const sample = /** @type {toa.samples.Message} */ {
      component: generate(),
      payload: generate(),
      input: generate()
    }

    samples.push(sample)
  }

  return samples
}

// components
for (let i = 0; i < random(3) + 1; i++) {
  const id = generate() + '.' + generate()
  const operations = {}
  const messages = {}

  for (let j = 0; j < random(3) + 1; j++) {
    const endpoint = generate()
    const label = generate()

    operations[endpoint] = ops()
    messages[label] = msgs()
  }

  suite.operations[id] = operations
}

/** @type {string} */
const label = generate()

suite.messages = { [label]: msgs() }

exports.suite = suite
