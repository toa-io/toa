import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import { console as output } from 'openspan'
import * as boot from '@toa.io/boot'
import { shortcuts } from '@toa.io/norm'
import { find } from '@toa.io/generic'
import { version } from '@toa.io/runtime'
import { graceful } from './lib/graceful.js'

const require = createRequire(import.meta.url)

const serve = async (argv) => {
  console.log('Runtime', version)

  argv.path = shortcuts.resolve(argv.path)

  const start = async () => {
    const module = find(argv.path, process.cwd())

    const { Factory } = await import(pathToFileURL(require.resolve(module)).href)

    const factory = new Factory(boot)

    if (factory.service === undefined) throw new Error(`Service is not implemented by ${argv.path}`)

    const service = await factory.service()

    // an extension that is off in this environment has nothing to run, and said so
    if (service === null)
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

export { serve }
