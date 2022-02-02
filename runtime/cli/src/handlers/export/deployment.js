'use strict'

const boot = require('@toa.io/boot')
const { console } = require('@toa.io/gears')

const { context: find } = require('../../util/find')

const dump = async (argv) => {
  const context = find(argv.path)
  const deployment = await boot.deployment(context)
  const path = await deployment.export(argv.target)

  console.log(path)
}

exports.dump = dump
