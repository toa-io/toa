'use strict'

const { Package } = require('@kookaburra/package')
const { Locator, Runtime } = require('@kookaburra/runtime')
const { operation } = require('./runtime/operation')
const { invocation } = require('./runtime/invocation')

async function runtime (component) {
  if (!(component instanceof Package)) { component = await Package.load(component) }

  const locator = Object.assign(new Locator(), component.locator)
  const invocations = component.operations.map(operation).map(invocation)
    .reduce((map, [name, invocation]) => (map[name] = invocation) && map, {})

  return new Runtime(locator, invocations)
}

exports.runtime = runtime
