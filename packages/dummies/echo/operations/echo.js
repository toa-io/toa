'use strict'

function observation ({ input, output, error }) {
  if (input.error) {
    Object.assign(error, input.error)
    return
  }

  Object.assign(output, input)
}

module.exports = observation
