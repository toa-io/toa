'use strict'

const boot = require('@toa.io/boot')

const serve = async (argv) => {
  const module = require.resolve(argv.path, { paths: [process.cwd()] })

  const { Factory } = require(module)

  /** @type {toa.core.extensions.Factory} */
  const factory = new Factory(boot)
  /** @type {toa.core.Connector} */
  const service = factory.service(argv.name)

  if (service === undefined) throw new Error(`Can't find service '${argv.name}' in ${argv.path}`)

  await service.connect()
}

exports.serve = serve
