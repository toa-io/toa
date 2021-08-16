'use strict'

const { Package } = require('@kookaburra/package')
const { io, Locator, Runtime, Schemas } = require('@kookaburra/runtime')
const { operation } = require('./runtime/operation')
const { invocation } = require('./runtime/invocation')
const { entity: createEntity } = require('./runtime/entity')
const { storage: createStorage } = require('./storage')

async function runtime (component) {
  if (typeof component === 'string') { component = await Package.load(component) }

  const schemas = new Schemas()

  schemas.add(io.error.schema)

  const locator = new Locator(component.locator.domain, component.locator.name)
  const storage = component.entity && createStorage(component.entity.storage, locator)
  const entity = createEntity(component.entity, storage, schemas)

  const invocations = component.operations
    .map(entity).map(operation).map(invocation)
    .reduce((map, [name, invocation]) => (map[name] = invocation) && map, {})

  schemas.compile()

  const runtime = new Runtime(locator, invocations)

  if (storage) { runtime.depends(storage) }

  return runtime
}

exports.runtime = runtime
