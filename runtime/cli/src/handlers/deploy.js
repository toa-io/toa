'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const deploy = async (argv) => {
  const path = find(argv.path)
  const operator = await boot.deployment(path)

  const options = {}

  if (argv.wait === true) options.wait = true
  if (argv.dry === true) options.dry = true

  await operator.install(options)
}

exports.deploy = deploy
