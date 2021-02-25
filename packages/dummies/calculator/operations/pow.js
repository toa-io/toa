'use strict'

async function observation ({ input, output }) {
  output.pow = input.a * input.b
}

module.exports = observation
