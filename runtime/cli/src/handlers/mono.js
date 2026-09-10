import { console as output } from 'openspan'
import { Connector } from '@toa.io/core'
import * as boot from '@toa.io/boot'
import { version } from '@toa.io/definitions'

import { graceful } from './lib/graceful.js'
import { discover } from './lib/services.js'
import { components as find } from '../util/find.js'
import { environment } from '@toa.io/generic'

/**
 * @param {Record<string, string | boolean | string[]>} argv
 * @return {Promise<void>}
 */
export async function mono(argv) {
  console.log('Runtime', version)

  const paths = find(argv.paths)

  // inside the workload, so that the boot span covers it and a halt builds it again
  const workload = new boot.Workload(async (workload) => {
    const services = await discover(paths, workload)
    const composition = workload.gate(async () => await boot.composition(paths, argv))
    const root = new Connector()

    root.depends([composition, ...services])

    return root
  })

  const start = async () => {
    graceful(workload)

    await workload.connect()
  }

  if (environment.get('TOA_BOOT_TRACE') === '1') await output.span('toa mono', start)
  else await start()

  if (argv.kill === true) await workload.disconnect()
}
