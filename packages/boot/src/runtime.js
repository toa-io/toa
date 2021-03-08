'use strict'

const { Package } = require('@kookaburra/package')
const { Locator, Runtime } = require('@kookaburra/runtime')
const { operation } = require('./runtime/operation')
const { invocation } = require('./runtime/invocation')
const { entity: createEntity } = require('./runtime/entity')
const { storage: createStorage } = require('./storage')

async function runtime (component) {
  if (typeof component === 'string') { component = await Package.load(component) }

  const locator = Object.assign(new Locator(), component.locator)
  const storage = component.entity && createStorage(component.entity.storage)
  const entity = createEntity(component.entity, storage)

  const invocations = component.operations
    .map(entity).map(operation).map(invocation)
    .reduce((map, [name, invocation]) => (map[name] = invocation) && map, {})

  const runtime = new Runtime(locator, invocations)

  if (storage) { runtime.depends(storage) }

  return runtime
}

exports.runtime = runtime
