'use strict'

const { deployment: { Factory } } = require('@toa.io/operations')
const { context: find } = require('../util/find')

/**
 * @param {toa.cli.deploy.Arguments} argv
 * @returns {Promise<void>}
 */
const deploy = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment)
  const operator = factory.operator()

  if (argv.dry === true) {
    const options = {}

    if (argv.namespace !== undefined) options.namespace = argv.namespace

    const output = await operator.template(options)

    console.log(output)
  } else {
    const options = {}

    if (argv.namespace !== undefined) options.namespace = argv.namespace
    if (argv.wait === true) options.wait = true
    if (argv.timeout !== undefined) options.timeout = argv.timeout

    await operator.install(options)
  }
}

exports.deploy = deploy
