'use strict'

const { Package } = require('@kookaburra/package')
const { io, Locator, Runtime, Schemas } = require('@kookaburra/runtime')
const { endpoints } = require('./runtime/endpoints')
const { entity: createEntity } = require('./runtime/entity')
const { storage: createStorage } = require('./storage')
const { bridge } = require('./runtime/bridge')
const { operation } = require('./runtime/operation')
const { invocation } = require('./runtime/invocation')

const runtime = async (path) => {
  const manifest = await Package.load(path)

  const schemas = new Schemas()

  schemas.add(io.error.schema)

  const locator = new Locator(manifest.domain, manifest.name, endpoints(manifest.operations))
  const storage = manifest.entity && createStorage(manifest.entity.storage, locator)
  const entity = createEntity(manifest.entity, storage, schemas)

  const invocations = manifest.operations
    .map(entity).map(bridge).map(operation).reduce(invocation, {})

  schemas.compile()

  const runtime = new Runtime(locator, invocations)

  if (storage) { runtime.depends(storage) }

  return runtime
}

exports.runtime = runtime
