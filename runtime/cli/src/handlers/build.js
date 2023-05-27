'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const build = async (argv) => {
  const path = find(argv.path)
  const registry = await boot.registry(path)

  await registry.build()
}

exports.build = build
