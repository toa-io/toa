'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const deploy = async (argv) => {
  const path = find(argv.path)
  const deployment = await boot.deployment(path)
  const images = await boot.images(path)

  await images.push()
  await deployment.install(argv['no-wait'] !== true)
}

exports.deploy = deploy
