'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const deploy = async (argv) => {
  const context = find(argv.path)
  const deployment = await boot.deployment(context)

  await deployment.install(argv.wait)
}

exports.deploy = deploy
