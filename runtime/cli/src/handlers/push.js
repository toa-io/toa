'use strict'

const { deployment: { Factory } } = require('@toa.io/operations')
const { context: find } = require('../util/find')

const push = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path)
  const registry = factory.registry()

  await registry.push()
}

exports.push = push
