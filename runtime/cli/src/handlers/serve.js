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
