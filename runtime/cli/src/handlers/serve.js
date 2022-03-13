'use strict'

const boot = require('@toa.io/boot')

const serve = async (argv) => {
  const module = require.resolve(argv.path, { paths: [process.cwd()] })

  const { Factory } = require(module)

  const factory = new Factory(boot)
  const service = factory.process()

  await service.connect()
}

exports.serve = serve
