'use strict'

async function transition ({ input, output }, object) {
  Object.assign(object, input)
  output.id = object.id
}

module.exports = transition
