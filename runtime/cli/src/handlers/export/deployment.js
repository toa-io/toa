'use strict'

const { console } = require('@toa.io/console')
const { context: find } = require('../../util/find')
const operations = require('../operations')

/**
 * @param {{ path: string, target: string, environment?: string }} argv
 * @returns {Promise<void>}
 */
const dump = async (argv) => {
  const path = find(argv.path)
  const operator = await operations.operator(path, argv.environment)
  const target = await operator.export(argv.target)

  console.log(target)
}

exports.dump = dump
