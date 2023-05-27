'use strict'

const boot = require('@toa.io/boot')
const { console } = require('@toa.io/console')

const { context: find } = require('../../util/find')

const prepare = async (argv) => {
  const context = find(argv.path)
  const operator = await boot.deployment(context)
  const path = await operator.prepare(argv.target)

  console.log(path)
}

// const prepare = async (argv) => {
//   const context = find(argv.path)
//   const registry = await boot.registry(context)
//   const path = await registry.prepare(argv.target)
//
//   console.log(path)
// }

exports.prepare = prepare
