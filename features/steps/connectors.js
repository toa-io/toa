'use strict'

const assert = require('node:assert')
const { exceptions } = require('@toa.io/core')
const { transpose, match } = require('@toa.io/generic')
const { parse } = require('@toa.io/yaml')

const { cli } = require('./.connectors/cli')
const stage = require('./.workspace/components')

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
    this.connector = /** @type {toa.core.Connector} */ await stage.component(reference)
  })

When('I compose {component} component',
  /**
   * @param {string} reference
   * @this {toa.features.Context}
   */
  async function (reference) {
    await stage.composition([reference])
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

    await stage.composition(references)
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

When('I invoke {token}',
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
    const request = parse(yaml)

    await call.call(this, endpoint, request)
  })

When('I call {endpoint}',
  /**
   * @param {string} endpoint
   * @this {toa.features.Context}
   */
  async function (endpoint) {
    await call.call(this, endpoint, {})
  })

Then('the reply is received:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function (yaml) {
    if (this.exception !== undefined) throw this.exception

    const object = parse(yaml)
    const matches = match(this.reply, object)

    assert.equal(matches, true, 'Reply does not match')
  })

Then('the reply is received',
  /**
   * @this {toa.features.Context}
   */
  function () {
    assert.notEqual(this.reply, undefined, 'Reply is received')
  })

Then('the following exception is thrown:',
  /**
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  function (yaml) {
    const object = parse(yaml)
    const matches = match(this.exception, object)

    assert.equal(matches, true, 'Exception doesn\'t match')
  })

When('an event {label} is emitted with the payload:',
  /**
   * @param {string} label
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (label, yaml) {
    const payload = parse(yaml)

    await stage.emit(label, payload)
  })

/**
 * @param {string} endpoint
 * @param {toa.core.Request} request
 * @returns {Promise<void>}
 */
async function invoke (endpoint, request = {}) {
  const component = /** @type {toa.core.Component} */ this.connector

  const { output, error, exception } = await component.invoke(endpoint, request)

  if (exception !== undefined) throw new Error(`${exceptions.names[exception.code]}: ${exception.message}`)

  this.reply = { output, error }
}

/**
 * @param {string} endpoint
 * @param {toa.core.Request} request
 * @this {toa.features.Context}
 * @return {Promise<void>}
 */
async function call (endpoint, request) {
  const operation = endpoint.split('.').pop()
  const remote = await stage.remote(endpoint)

  try {
    this.reply = await remote.invoke(operation, request)
  } catch (exception) {
    this.exception = exception
  }

  await remote.disconnect()
}
