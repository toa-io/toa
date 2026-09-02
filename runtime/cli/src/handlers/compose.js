import { console as output } from 'openspan'
import { pick } from '@toa.io/generic'
import * as boot from '@toa.io/boot'
import { version } from '@toa.io/runtime'

import * as docker from './docker/index.js'
import { graceful } from './lib/graceful.js'
import { components as find } from '../util/find.js'

/**
 * @param {Record<string, string | boolean>} argv
 * @return {Promise<void>}
 */
async function compose (argv) {
  console.log('Runtime', version)

  if (argv.dock === true) return dock(argv)

  const paths = find(argv.paths)

  let composition

  const start = async () => {
    composition = await boot.composition(paths, argv)

    graceful(composition)

    await composition.connect()
  }

  // the trace of the startup
  if (process.env.TOA_BOOT_TRACE === '1') await output.span('toa compose', start)
  else await start()

  if (argv.kill === true) await composition.disconnect()
}

/**
 * @param {Record<string, string | string[] | boolean>} argv
 * @return {Promise<void>}
 */
async function dock (argv) {
  const repository = await docker.build(argv.context, argv.paths)
  const args = pick(argv, ['kill', 'bindings'])
  const command = docker.command('toa compose *', args)

  await docker.run(repository, command, argv.env)
}

export { compose }
