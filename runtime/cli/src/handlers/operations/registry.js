'use strict'

const { context: load } = require('@toa.io/norm')
const { deployment: { Factory } } = require('@toa.io/operations')

async function registry (path) {
  const context = await load(path)
  const factory = new Factory(context)

  return factory.registry()
}

exports.registry = registry
