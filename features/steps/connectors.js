'use strict'

const assert = require('node:assert')
const { transpose, match } = require('@toa.io/generic')
const { parse } = require('@toa.io/yaml')

const { cli } = require('./.connectors/cli')
const get = require('./.workspace/components')

const { When, Then } = require('@cucumber/cucumber')

When('I debug command {word}',
  /**
   * @param {string} name
   * @param {import('@cucumber/cucumber').DataTable} inputs
   * @this {toa.features.Context}
   */
  async function (name, inputs) {
    const handler = cli(name)
    const argv = Object.fromEntries(inputs.raw())

    this.connector = await handler(argv)
  })

When('I boot {component} component',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function (reference) {
    this.connector = /** @type {toa.core.Connector} */ await get.component(reference)
  })

When('I compose {component} component',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function (reference) {
    this.connector = await get.composition([reference])
  })

When('I compose components:',
  /**
   * @param {import('@cucumber/cucumber').DataTable} data
   * @this {toa.features.Context}
   */
  async function (data) {
    const cells = data.raw()
    const rows = transpose(cells)
    const references = rows[0]

    this.connector = await get.composition(references)
  })

Then('I disconnect',
  /**
   * @this {toa.features.Context}
   */
  async function () {
    if (this.connector) await this.connector.disconnect()
    if (this.storage?.migration) await this.storage.migration.disconnect()

    if (this.amqp) {
      await this.amqp.channel.close()
      await this.amqp.connection.close()
    }
  })

When('I invoke {word}',
  /**
   * @param {string} endpoint
   * @this {toa.features.Context}
   */
  async function (endpoint) {
    await invoke.call(this, endpoint)
  })

When('I invoke {token} with:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (endpoint, yaml) {
    const request = parse(yaml)

    await invoke.call(this, endpoint, request)
  })

When('I call {endpoint} with:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (endpoint, yaml) {
    const [namespace, name, operation] = endpoint.split('.')
    const remote = await get.remote(namespace, name)
    const request = parse(yaml)

    await remote.invoke(operation, request)
    await remote.disconnect()
  })

Then('the reply should match:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function (yaml) {
    const object = parse(yaml)
    const matches = match(this.reply, object)

    assert.equal(matches, true, 'Reply does not match')
  })

/**
 * @param {string} endpoint
 * @param {toa.core.Request} request
 * @returns {Promise<void>}
 */
async function invoke (endpoint, request = {}) {
  const component = /** @type {toa.core.Component} */ this.connector

  const { output, error, exception } = await component.invoke(endpoint, request)

  if (exception !== undefined) {
    throw new Error(exception.message)
  }

  this.reply = { output, error }
}
