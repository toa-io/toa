'use strict'

const operations = require('./operations')
const { context: find } = require('../util/find')

const push = async (argv) => {
  const path = find(argv.path)
  const registry = await operations.registry(path)

  await registry.push()
}

exports.push = push
