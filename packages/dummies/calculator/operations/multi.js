'use strict'

async function transition ({ input, output }) {
  output.pow = input.a * input.b
}

module.exports = transition
