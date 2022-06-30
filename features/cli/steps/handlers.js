'use strict'

const { load } = require('./.handlers/load')

const { When, Then } = require('@cucumber/cucumber')

When('I debug {word}',
  /**
   * @param {string} name
   * @param {import('@cucumber/cucumber').DataTable} inputs
   */
  async function (name, inputs) {
    const handler = load(name)
    const argv = Object.fromEntries(inputs.raw())

    this.handler = await handler(argv)
  })

Then('I disconnect',
  async function () {
    await this.handler.disconnect()
  })
