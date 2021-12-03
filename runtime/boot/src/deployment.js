'use strict'

const { Deployment } = require('@toa.io/operations')
const { context: load } = require('@toa.io/package')

const deployment = async (path) => {
  const context = await load(path)

  return new Deployment(context)
}

exports.deployment = deployment
