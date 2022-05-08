'use strict'

const boot = require('@toa.io/boot')
const { console } = require('@toa.io/gears')

const { context: find } = require('../../util/find')

const dump = async (argv) => {
  const context = find(argv.path)
  const operator = await boot.deployment(context)
  const path = await operator.export(argv.target)

  console.log(path)
}

exports.dump = dump
