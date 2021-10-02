'use strict'

const instances = {}

const factory = (binding) => {
  if (!instances[binding]) instances[binding] = new (require(binding).Factory)()

  return instances[binding]
}

exports.factory = factory
