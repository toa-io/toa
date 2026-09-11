import { console as output } from 'openspan'
import { Connector } from '@toa.io/core'
import * as boot from '@toa.io/boot'
import { version } from '@toa.io/definitions'

import { graceful } from './lib/graceful.js'
import { create } from './lib/services.js'
import { environment } from '@toa.io/generic'

export const serve = async (argv) => {
  console.log('Runtime', version)

  const paths = Array.isArray(argv.paths) ? argv.paths : [argv.paths]

  const workload = new boot.Workload(async () => {
    // the list is exact: what it names runs, or nothing does
    const services = await create(paths, true)

    const root = new Connector()

    root.depends(services)

    return root
  })

  const start = async () => {
    graceful(workload)

    await workload.connect()
  }

  // the trace of the startup
  if (environment.get('TOA_BOOT_TRACE') === '1')
    await output.span({ name: 'toa serve', attributes: { paths } }, start)
  else await start()
}
