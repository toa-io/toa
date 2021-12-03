'use strict'

const { discovery } = require('../../runtime/boot/src/discovery')

const factory = async () => {
  if (factory.instance === undefined) factory.instance = await discovery()

  return factory.instance
}

exports.discovery = factory
