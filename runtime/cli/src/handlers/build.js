'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const build = async (argv) => {
  const path = find(argv.path)
  const operator = await boot.deployment(path)

  await operator.build()
}

exports.build = build
