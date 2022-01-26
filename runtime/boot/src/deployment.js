'use strict'

const { deployment: { Factory } } = require('@toa.io/operations')
const { context: load } = require('@toa.io/package')

const deployment = async (path) => {
  const context = await load(path)
  const factory = new Factory(context)

  return factory.deployment()
}

exports.deployment = deployment
