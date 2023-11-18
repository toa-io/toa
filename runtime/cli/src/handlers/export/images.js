'use strict'

const { console } = require('@toa.io/console')
const { context: find } = require('../../util/find')
const operations = require('../operations')

const prepare = async (argv) => {
  const path = find(argv.path)
  const operator = await operations.operator(path, argv.environment)
  const target = await operator.prepare(argv.target)

  console.log(target)
}

exports.prepare = prepare
