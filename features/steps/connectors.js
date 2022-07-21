'use strict'

const { transpose } = require('@toa.io/libraries/generic')
const { parse } = require('@toa.io/libraries/yaml')

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
    this.connector = /** @type {toa.core.Connector} */ await get.runtime(reference)
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

    if (this.remotes) {
      for (const remote of Object.values(this.remotes)) await remote.disconnect()
    }
  })

When('I invoke {word} with:',
  /**
   * @param {string} endpoint
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (endpoint, yaml) {
    const runtime = /** @type {toa.core.Runtime} */ this.connector
    const request = parse(yaml)

    const { exception } = await runtime.invoke(endpoint, request)

    if (exception !== undefined) {
      throw new Error(exception.message)
    }
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
