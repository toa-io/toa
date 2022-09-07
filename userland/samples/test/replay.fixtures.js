'use strict'

const { generate } = require('randomstring')
const { random } = require('@toa.io/libraries/generic')

/** @type {toa.samples.Suite} */
const suite = {}

const samples = () => {
  const samples = []

  for (let i = 0; i < random(3) + 1; i++) {
    samples.push({
      request: {
        input: generate()
      },
      reply: {
        output: generate()
      },
      context: {
        local: generate()
      }
    })
  }

  return samples
}

// components
for (let i = 0; i < random(3) + 1; i++) {
  const id = generate() + '.' + generate()

  suite[id] = {}

  const set = suite[id]

  // operations
  for (let j = 0; j < random(3) + 1; j++) {
    const operation = generate()

    set[operation] = samples()
  }
}

exports.suite = suite
