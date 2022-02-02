'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const deploy = async (argv) => {
  const path = find(argv.path)
  const deployment = await boot.deployment(path, { log: argv.output === true })

  const options = {
    wait: argv['no-wait'] !== true,
    dry: argv.dry === true
  }

  await deployment.install(options)
}

exports.deploy = deploy
