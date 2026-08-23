'use strict'

const { context: find } = require('../../util/find')
const { deployment: { Factory } } = require('@toa.io/operations')

const prepare = async (argv) => {
  const path = find(argv.path)
  const factory = await Factory.create(path, argv.environment, { mono: argv.mono === true })
  const operator = factory.operator()
  const target = await operator.prepare(argv.target)

  console.log(target)
}

exports.prepare = prepare
