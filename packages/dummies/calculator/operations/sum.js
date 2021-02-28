'use strict'

async function transition ({ input, output }) {
  output.sum = input.a + input.b
}

module.exports = transition
