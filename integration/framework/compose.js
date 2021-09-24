'use strict'

const boot = require('../../runtime/boot/src/composition')
const { locate } = require('./dummies')

const compose = async (dummies, options) => {
  const components = dummies.map(locate)
  const composition = await boot.composition(components, options)

  await composition.connect()

  return composition
}

exports.compose = compose
