import { console as output } from 'openspan'
import { version } from '@toa.io/runtime'

import { graceful } from './lib/graceful.js'
import { create } from './lib/services.js'

export const serve = async (argv) => {
  console.log('Runtime', version)

  const start = async () => {
    const [service] = await create([argv.path])

    // an extension that is off in this environment has nothing to run, and said so
    if (service === undefined)
      throw new Error(`'${argv.path}' has no service to run in this environment: ` +
        'its variables are absent. Regenerate the environment file with `toa env`.')

    graceful(service)

    await service.connect()
  }

  // the trace of the startup
  if (process.env.TOA_BOOT_TRACE === '1')
    await output.span({ name: 'toa serve', attributes: { path: argv.path } }, start)
  else
    await start()
}
