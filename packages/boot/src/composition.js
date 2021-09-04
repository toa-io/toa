'use strict'

const { Connector } = require('@kookaburra/runtime')
const { runtime } = require('./runtime')
const { producer } = require('./bindings')

async function composition (components) {
  const composition = new Connector()
  const runtimes = await Promise.all(components.map(async (component) => runtime(component)))
  const bindings = producer(runtimes, ['@kookaburra/bindings.http'])

  composition.depends(bindings)

  return composition
}

exports.composition = composition
