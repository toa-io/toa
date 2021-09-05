'use strict'

const { Connector } = require('@kookaburra/runtime')
const { runtime } = require('./runtime')
const { producers } = require('./bindings')

async function composition (components, options) {
  const composition = new Connector()
  const runtimes = await Promise.all(components.map(async (component) => runtime(component)))
  const bindings = producers(runtimes, options.bindings || DEFAULTS.bindings)

  composition.depends(bindings)

  return composition
}

const DEFAULTS = {
  bindings: ['@kookaburra/bindings.http', '@kookaburra/bindings.amqp']
}

exports.composition = composition
