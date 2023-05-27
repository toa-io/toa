'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const push = async (argv) => {
  const path = find(argv.path)
  const operator = await boot.deployment(path, argv.environment)

  await operator.push()
}

exports.push = push
