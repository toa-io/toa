'use strict'

const { context: find } = require('../util/find')
const operations = require('./operations')

const build = async (argv) => {
  const path = find(argv.path)
  const registry = await operations.registry(path)

  await registry.build()
}

exports.build = build
