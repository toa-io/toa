'use strict'

const { build } = require('./build')
const { run } = require('./run')
const { command } = require('./command')

/**
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {Promise<void>}
 */
async function dock (argv) {
  const repository = await build(argv.paths)
  const cmd = command(argv)

  await run(repository, cmd)
}

exports.dock = dock
