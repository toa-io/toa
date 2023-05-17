'use strict'

const boot = require('@toa.io/boot')
const { console } = require('@toa.io/console')

const { context: find } = require('../../util/find')

const prepare = async (argv) => {
  const context = find(argv.path)
  const operator = await boot.deployment(context, argv.environment)
  const path = await operator.prepare(argv.target)

  console.log(path)
}

exports.prepare = prepare
