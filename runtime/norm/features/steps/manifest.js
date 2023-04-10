'use strict'

const assert = require('node:assert')
const { join } = require('node:path')
const { parse, save } = require('@toa.io/yaml')
const { directory } = require('@toa.io/filesystem')
const { match } = require('@toa.io/generic')

const { component: load } = require('../../src')

const { Given, When, Then } = require('@cucumber/cucumber')

/**
 * @param variant {'operations'| 'receivers'}
 * @param type {string}
 * @param yaml {string}
 * @return {Promise<void>}
 */
async function checkManifest (variant, type, yaml) {
  const temp = await directory.temp()
  const path = join(temp, 'manifest.toa.yaml')

  await save(this.manifest, path)

  const manifest = await load(temp)
  const operation = manifest[variant][type]
  const query = parse(yaml)
  const contains = match(operation, query)

  assert.equal(contains, true)
}

Given('I have an entity schema:',
  /**
   * @param {string} yaml
   * @this {toa.norm.features.Context}
   */
  function (yaml) {
    const schema = parse(yaml)

    this.manifest.entity = { schema }
  })

When('I declare operation {operation} with:',
  /**
   * @param {toa.norm.component.operations.Type} type
   * @param {string} yaml
   * @this {toa.norm.features.Context}
   */
  function (type, yaml) {
    /** @type {toa.norm.component.Operation} */
    const declaration = parse(yaml)

    declaration.type = type
    declaration.scope = scope(type)

    this.manifest.operations = { [type]: declaration }
  })

When('I declare receiver for {event} with:',
  async function (event, yaml) {
    const declaration = parse(yaml)

    this.manifest.receivers = { [event]: declaration }
  })

Then('normalized operation {operation} declaration must contain:',
  /**
   * @param {toa.norm.component.operations.Type} type
   * @param {string} yaml
   * @this {toa.norm.features.Context}
   */
  async function (type, yaml) {
    await checkManifest.call(this, 'operations', type, yaml)
  })

Then('normalized receiver for event {event} must contain:',
  /**
   * @param {string} event
   * @param {string} yaml
   * @this {toa.norm.features.Context}
   */
  async function (event, yaml) {
    await checkManifest.call(this, 'receivers', event, yaml)
  })

/**
 * @param {toa.norm.component.operations.Type} type
 * @returns {toa.norm.component.operations.Scope}
 */
const scope = (type) => {
  return type === 'assignment' ? 'changeset' : 'object'
}
