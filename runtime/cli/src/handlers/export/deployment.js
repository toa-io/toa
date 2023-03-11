'use strict'

const boot = require('@toa.io/boot')
const { console } = require('@toa.io/console')

const { context: find } = require('../../util/find')

/**
 * @param {{ path: string, target: string, environment?: string }} argv
 * @returns {Promise<void>}
 */
const dump = async (argv) => {
  const context = find(argv.path)
  const operator = await boot.deployment(context, argv.environment)
  const path = await operator.export(argv.target)

  console.log(path)
}

exports.dump = dump
