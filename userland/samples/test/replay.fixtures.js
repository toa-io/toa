'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')

/** @type {toa.samples.Suite} */
const suite = { autonomous: true, components: {} }

/**
 * @returns {toa.samples.Operation[]}
 */
const ops = () => {
  /** @type {toa.samples.Operation[]} */
  const samples = []

  for (let i = 0; i < random(3) + 1; i++) {
    /** @type {toa.samples.Operation} */
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
 * @returns {toa.samples.messages.Sample[]}
 */
const msgs = () => {
  /** @type {toa.samples.messages.Sample[]} */
  const samples = []

  for (let i = 0; i < random(3) + 1; i++) {
    const sample = /** @type {toa.samples.messages.Sample} */ {
      payload: generate(),
      input: generate()
    }

    samples.push(sample)
  }

  return samples
}

// components
for (let i = 0; i < random(3) + 1; i++) {
  const operations = {}
  const messages = {}

  for (let j = 0; j < random(3) + 1; j++) {
    const endpoint = generate()
    const label = generate()

    operations[endpoint] = ops()
    messages[label] = msgs()
  }

  const id = generate() + '.' + generate()

  suite.components[id] = { operations, messages }
}

exports.suite = suite
