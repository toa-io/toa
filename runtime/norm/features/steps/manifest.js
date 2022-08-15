'use strict'

const assert = require('node:assert')
const { join } = require('node:path')
const { parse, save } = require('@toa.io/libraries/yaml')
const { directory } = require('@toa.io/libraries/filesystem')
const { match } = require('@toa.io/libraries/generic')

const { component: load } = require('../../src')

const { Given, When, Then } = require('@cucumber/cucumber')

Given('I have an entity schema:',
  /**
   * @param {string} yaml
   * @this {toa.norm.features.Context}
   */
  function (yaml) {
    const schema = parse(yaml)

    this.manifest.entity = { schema }
  })

When('I declare {operation} with:',
  /**
   * @param {toa.norm.component.operations.Type} type
   * @param {string} yaml
   * @this {toa.norm.features.Context}
   */
  function (type, yaml) {
    /** @type {toa.norm.component.Operation} */
    const declaration = parse(yaml)

    declaration.type = type
    declaration.subject = subject(type)

    this.manifest.operations = { [type]: declaration }
  })

Then('normalized {operation} declaration must contain:',
  /**
   * @param {toa.norm.component.operations.Type} type
   * @param {string} yaml
   * @this {toa.norm.features.Context}
   */
  async function (type, yaml) {
    const temp = await directory.temp()
    const path = join(temp, 'manifest.toa.yaml')

    await save(this.manifest, path)

    const manifest = await load(temp)
    const operation = manifest.operations[type]
    const query = parse(yaml)
    const contains = match(operation, query)

    assert.equal(contains, true)
  })

/**
 * @param {toa.norm.component.operations.Type} type
 * @returns {toa.norm.component.operations.Subject}
 */
const subject = (type) => {
  return type === 'assignment' ? 'changeset' : 'object'
}
