'use strict'

const { context: find } = require('../util/find')
const { deployment: { Factory } } = require('@toa.io/operations')

const build = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment)
  const registry = factory.registry()

  await registry.build()
}

exports.build = build
