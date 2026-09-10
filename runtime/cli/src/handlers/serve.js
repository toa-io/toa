import { console as output } from 'openspan'
import { Connector } from '@toa.io/core'
import { version } from '@toa.io/definitions'

import { graceful } from './lib/graceful.js'
import { create } from './lib/services.js'
import { environment } from '@toa.io/generic'

export const serve = async (argv) => {
  console.log('Runtime', version)

  const paths = Array.isArray(argv.paths) ? argv.paths : [argv.paths]

  const start = async () => {
    const services = await create(paths)

    // an extension that is off in this environment has nothing to run, and said so
    if (services.length === 0) {
      const listed = paths.map((path) => `'${path}'`).join(', ')

      throw new Error(
        `${listed} ${paths.length === 1 ? 'has' : 'have'} no service to run in this environment: ` +
          'its variables are absent. Regenerate the environment file with `toa env`.'
      )
    }

    const connector = new Connector()

    connector.depends(services)
    graceful(connector)

    await connector.connect()
  }

  // the trace of the startup
  if (environment.get('TOA_BOOT_TRACE') === '1')
    await output.span({ name: 'toa serve', attributes: { paths } }, start)
  else await start()
}
