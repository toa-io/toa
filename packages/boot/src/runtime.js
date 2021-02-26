'use strict'

const { Package } = require('@kookaburra/package')
const { Locator, Runtime } = require('@kookaburra/runtime')

const { operation } = require('./runtime/operation')
const { invocation } = require('./runtime/invocation')

async function runtime (component) {
  if (!(component instanceof Package)) { component = await Package.load(component) }

  const locator = Object.assign(new Locator(), component.locator)
  const invocations = Object.entries(component.algorithms).map(operation).map(invocation).reduce(reduce, {})

  return new Runtime(locator, invocations)
}

function reduce (map, [name, invocation]) {
  map[name] = invocation

  return map
}

exports.runtime = runtime
