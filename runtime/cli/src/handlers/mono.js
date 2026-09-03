import { console as output } from 'openspan'
import { Connector } from '@toa.io/core'
import * as boot from '@toa.io/boot'
import { version } from '@toa.io/runtime'

import { graceful } from './lib/graceful.js'
import { discover } from './lib/services.js'
import { components as find } from '../util/find.js'

/**
 * @param {Record<string, string | boolean | string[]>} argv
 * @return {Promise<void>}
 */
export async function mono (argv) {
  console.log('Runtime', version)

  const paths = find(argv.paths)
  const services = await discover(paths)
  const composition = await boot.composition(paths, argv)
  const connector = new Connector()

  connector.depends([composition, ...services])

  const start = async () => {
    graceful(connector)

    await connector.connect()
  }

  if (process.env.TOA_BOOT_TRACE === '1') await output.span('toa mono', start)
  else await start()

  if (argv.kill === true) await connector.disconnect()
}
