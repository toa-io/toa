'use strict'

const { context: load } = require('@toa.io/norm')
const { deployment: { Factory } } = require('@toa.io/operations')

async function operator (path, environment) {
  const context = await load(path, environment)
  const factory = new Factory(context)

  return factory.operator()
}

exports.operator = operator
