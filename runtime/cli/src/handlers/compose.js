import { console as output } from 'openspan'
import { pick } from '@toa.io/generic'
import { Connector } from '@toa.io/core'
import * as boot from '@toa.io/boot'
import { version } from '@toa.io/runtime'

import * as docker from './docker/index.js'
import { graceful } from './lib/graceful.js'
import { create } from './lib/services.js'
import { components as find } from '../util/find.js'

/**
 * @param {Record<string, string | boolean>} argv
 * @return {Promise<void>}
 */
export async function compose (argv) {
  console.log('Runtime', version)

  if (argv.dock === true) return dock(argv)

  const paths = find(argv.paths)
  const references = services(argv)

  let connector

  const start = async () => {
    const composition = await boot.composition(paths, argv)

    if (references.length === 0) connector = composition
    else {
      connector = new Connector()

      connector.depends([composition, ...await create(references)])
    }

    graceful(connector)

    await connector.connect()
  }

  // the trace of the startup
  if (process.env.TOA_BOOT_TRACE === '1') await output.span('toa compose', start)
  else await start()

  if (argv.kill === true) await connector.disconnect()
}

/**
 * The deployment states them in the environment, so the image is the same whichever
 * services a composition runs; a local run states them on the command line.
 *
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {string[]}
 */
function services (argv) {
  if (argv.service !== undefined) return argv.service

  const variable = process.env.TOA_SERVICES?.trim()

  return variable === undefined || variable === '' ? [] : variable.split(/\s+/)
}

/**
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {Promise<void>}
 */
async function dock (argv) {
  const repository = await docker.build(argv.context, argv.paths)
  const args = pick(argv, ['kill', 'bindings', 'service'])
  const command = docker.command('toa compose *', args)

  await docker.run(repository, command, argv.env)
}
