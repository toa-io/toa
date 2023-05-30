'use strict'

const { file: { dot } } = require('@toa.io/filesystem')
const { pick } = require('@toa.io/generic')
const boot = require('@toa.io/boot')

const docker = require('./docker')
const { components: find } = require('../util/find')

/**
 * @param {Record<string, string | boolean>} argv
 * @return {Promise<void>}
 */
async function compose (argv) {
  if (argv.dock === true) return dock(argv)

  const paths = find(argv.paths)
  const composition = await boot.composition(paths, argv)

  await composition.connect()

  if (argv.kill === true) await composition.disconnect()
}

/**
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {Promise<void>}
 */
async function dock (argv) {
  const envFile = await dot('env')
  const repository = await docker.build(argv.paths)
  const args = pick(argv, ['kill', 'bindings'])
  const command = docker.command('toa compose *', args)

  await docker.run(repository, command, ['--env-file', envFile])
}

exports.compose = compose
