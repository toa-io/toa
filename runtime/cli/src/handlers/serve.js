'use strict'

const boot = require('@toa.io/boot')
const { shortcuts } = require('@toa.io/formation')
const { directory: { find } } = require('@toa.io/libraries/generic')

const serve = async (argv) => {
  argv.path = shortcuts.resolve(argv.path)

  const module = find(argv.path, process.cwd())

  const { Factory } = require(module)

  /** @type {toa.core.extensions.Factory} */
  const factory = new Factory(boot)

  /** @type {toa.core.Connector} */
  const service = factory.service()

  if (service === undefined) throw new Error(`Cannot find service '${argv.name}' in ${argv.path}`)

  await service.connect()

  // for tests
  return service
}

exports.serve = serve
