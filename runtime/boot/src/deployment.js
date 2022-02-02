'use strict'

const { deployment: { Factory } } = require('@toa.io/operations')
const { context: load } = require('@toa.io/package')

const deployment = async (path, options) => {
  const context = await load(path)
  const factory = new Factory(context, options)

  return factory.deployment()
}

exports.deployment = deployment
