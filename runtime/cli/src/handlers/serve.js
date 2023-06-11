'use strict'

const boot = require('@toa.io/boot')
const { shortcuts } = require('@toa.io/norm')
const { directory: { find } } = require('@toa.io/filesystem')

const serve = async (argv) => {
  argv.path = shortcuts.resolve(argv.path)

  const module = find(argv.path, process.cwd())

  const { Factory } = require(module)

  /** @type {toa.core.extensions.Factory} */
  const factory = new Factory(boot)

  /** @type {toa.core.Connector} */
  const service = factory.service(argv.service)

  if (service === null) throw new Error(`Service '${argv.service}' is not implemented by ${argv.path}`)

  await service.connect()

  // for tests
  return service
}

exports.serve = serve
