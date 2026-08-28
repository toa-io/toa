'use strict'

const { console: output } = require('openspan')
const boot = require('@toa.io/boot')
const { shortcuts } = require('@toa.io/norm')
const { directory: { find } } = require('@toa.io/filesystem')
const { version } = require('@toa.io/runtime')
const { graceful } = require('./lib/graceful')

const serve = async (argv) => {
  console.log('Runtime', version)

  argv.path = shortcuts.resolve(argv.path)

  const start = async () => {
    const module = find(argv.path, process.cwd())

    const { Factory } = require(module)

    const factory = new Factory(boot)

    if (factory.service === undefined) throw new Error(`Service is not implemented by ${argv.path}`)

    const service = factory.service()

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

exports.serve = serve
