'use strict'

const { Package } = require('@kookaburra/package')
const { Runtime } = require('@kookaburra/runtime')

const { operation } = require('./runtime/operation')
const { invocation } = require('./runtime/invocation')

async function runtime (dir) {
  const component = await Package.load(dir)
  const invocations = Object.entries(component.algorithms).map(operation).map(invocation).reduce(reduce, {})

  return new Runtime(invocations)
}

function reduce (map, [name, invocation]) {
  map[name] = invocation

  return map
}

exports.runtime = runtime
