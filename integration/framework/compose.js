'use strict'

const boot = require('../../runtime/boot/src/composition')
const { locate } = require('./dummies')

const compose = async (options) => {
  const components = options.dummies.map(locate)
  const bindings = options.bindings?.map((binding) => '@kookaburra/bindings.' + binding)
  const composition = await boot.composition(components, { bindings })
  await composition.connect()

  return composition
}

exports.compose = compose
