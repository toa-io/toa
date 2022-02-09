'use strict'

const instances = {}

const factory = (binding) => {
  if (instances[binding] === undefined) instances[binding] = new (require(binding).Factory)()

  return instances[binding]
}

exports.factory = factory
