'use strict'

const { parse } = require('@toa.io/libraries/yaml')

const { cli } = require('./.connectors/cli')
const { connect } = require('./.workspace/components')

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
    this.connector = await connect(reference)
  })

Then('I disconnect',
  /**
   * @this {toa.features.Context}
   */
  async function () {
    await this.connector.disconnect()

    if (this.migration) await this.migration.disconnect()
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

    await runtime.invoke(endpoint, request)
  })
