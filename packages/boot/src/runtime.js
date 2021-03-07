'use strict'

const { Package } = require('@kookaburra/package')
const { Locator, Runtime } = require('@kookaburra/runtime')
const { operation } = require('./runtime/operation')
const { invocation } = require('./runtime/invocation')
const { entity: createEntity } = require('./runtime/entity')

async function runtime (component) {
  if (typeof component === 'string') { component = await Package.load(component) }

  const locator = Object.assign(new Locator(), component.locator)
  const entity = createEntity(component.entity)

  const invocations = component.operations
    .map(entity.operations).map(operation).map(invocation)
    .reduce((map, [name, invocation]) => (map[name] = invocation) && map, {})

  const runtime = new Runtime(locator, invocations)

  if (entity.connector) { runtime.depends(entity.connector) }

  return runtime
}

exports.runtime = runtime
