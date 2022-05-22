'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

/**
 * @param {{ wait: boolean, dry: boolean, path: string }} argv
 * @returns {Promise<void>}
 */
const deploy = async (argv) => {
  const path = find(argv.path)
  const operator = await boot.deployment(path)

  if (argv.dry === true) {
    const output = await operator.template()

    console.log(output)
  } else {
    const options = {}

    if (argv.wait === true) options.wait = true

    await operator.install(options)
  }
}

exports.deploy = deploy
