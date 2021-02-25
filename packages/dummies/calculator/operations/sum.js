'use strict'

async function observation ({ input, output }) {
  output.sum = input.a + input.b
}

module.exports = observation
