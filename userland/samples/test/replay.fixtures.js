'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')

/** @type {toa.samples.Suite} */
const suite = { autonomous: true, components: {} }

const ops = () => {
  /** @type {toa.samples.operations.Sample[]} */
  const samples = []

  for (let i = 0; i < random(3) + 1; i++) {
    /** @type {toa.samples.operations.Sample} */
    const sample = {
      request: {
        input: generate()
      },
      reply: {
        output: generate()
      },
      context: {
        local: generate()
      },
      storage: {
        current: generate(),
        next: generate()
      }
    }

    samples.push(sample)
  }

  return samples
}

// components
for (let i = 0; i < random(3) + 1; i++) {
  const operations = {}

  for (let j = 0; j < random(3) + 1; j++) {
    const operation = generate()

    operations[operation] = ops()
  }

  const id = generate() + '.' + generate()

  suite.components[id] = { operations }
}

exports.suite = suite
