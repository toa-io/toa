'use strict'

const { console } = require('@toa.io/console')
const { context: find } = require('../../util/find')
const { deployment: { Factory } } = require('@toa.io/operations')

/**
 * @param {{ path: string, target: string, environment: string }} argv
 * @returns {Promise<void>}
 */
const tags = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment)
  const operator = factory.operator()
  const tags = operator.tags()

  for (const tag of tags)
    console.log(tag)
}

exports.tags = tags
