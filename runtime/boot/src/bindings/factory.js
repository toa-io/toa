'use strict'

let instances = {}

const factory = (binding) => {
  if (instances[binding] === undefined) instances[binding] = new (require(binding).Factory)()

  return instances[binding]
}

// for testing purposes
const reset = () => (instances = {})

exports.factory = factory
exports.reset = reset
