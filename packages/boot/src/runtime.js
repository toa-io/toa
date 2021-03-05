'use strict'

const { Package } = require('@kookaburra/package')
const { Locator, Runtime } = require('@kookaburra/runtime')
const { operation } = require('./runtime/operation')
const { invocation } = require('./runtime/invocation')
const { state: createState } = require('./runtime/state')

async function runtime (component) {
  if (typeof component === 'string') { component = await Package.load(component) }

  const locator = Object.assign(new Locator(), component.locator)
  const state = createState(component.state)

  const invocations = component.operations
    .map(state.operations).map(operation).map(invocation)
    .reduce((map, [name, invocation]) => (map[name] = invocation) && map, {})

  const runtime = new Runtime(locator, invocations)

  if (state.connector) { runtime.depends(state.connector) }

  return runtime
}

exports.runtime = runtime
