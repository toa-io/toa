'use strict'

async function observation ({ input, output }) {
  output.div = input.a / input.b
}

module.exports = observation
