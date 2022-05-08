'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const deploy = async (argv) => {
  const path = find(argv.path)
  const operator = await boot.deployment(path)

  const options = {
    wait: argv['no-wait'] !== true,
    dry: argv.dry === true
  }

  await operator.install(options)
}

exports.deploy = deploy
