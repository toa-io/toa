'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

/**
 * @param {toa.cli.deploy.Arguments} argv
 * @returns {Promise<void>}
 */
const deploy = async (argv) => {
  const path = find(argv.path)
  const operator = await boot.deployment(path, argv.environment)

  if (argv.dry === true) {
    const options = {}

    if (argv.namespace !== undefined) options.namespace = argv.namespace

    const output = await operator.template(options)

    console.log(output)
  } else {
    const options = {}

    if (argv.namespace !== undefined) options.namespace = argv.namespace
    if (argv.wait === true) options.wait = true

    await operator.install(options)
  }
}

exports.deploy = deploy
