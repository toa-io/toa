'use strict'

const boot = require('@toa.io/boot')

const { context: find } = require('../util/find')

const push = async (argv) => {
  const path = find(argv.path)
  const registry = await boot.registry(path)

  await registry.push()
}

exports.push = push
