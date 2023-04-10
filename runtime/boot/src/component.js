'use strict'

const { remap } = require('@toa.io/generic')
const { Component, Locator, State, entities } = require('@toa.io/core')
const { Schema } = require('@toa.io/schema')

const boot = require('./index')

/**
 * @param {toa.norm.Component} manifest
 * @returns {Promise<toa.core.Component>}
 */
const component = async (manifest) => {
  const name = manifest.entity.storage
  const locator = new Locator(manifest.name, manifest.namespace)
  const storage = boot.storage(locator, name, manifest.properties?.[name])
  const context = await boot.context(manifest)
  const emission = boot.emission(manifest.events, locator)
  const schema = new Schema(manifest.entity.schema)
  const entity = new entities.Factory(schema)
  const state = new State(storage, entity, emission, manifest.entity.initialized)

  const operations = remap(manifest.operations, (definition, endpoint) =>
    boot.operation(manifest, endpoint, definition, context, state))

  const component = new Component(locator, operations)

  if (storage) component.depends(storage)
  if (emission) component.depends(emission)

  return boot.extensions.component(component)
}

exports.component = component
