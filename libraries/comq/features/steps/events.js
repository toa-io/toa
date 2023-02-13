'use strict'

const assert = require('node:assert')
const { generate } = require('randomstring')
const { timeout } = require('@toa.io/libraries/generic')
const { Given, When, Then } = require('@cucumber/cucumber')

Given('I consume events from {token} exchange as {token}',
  /**
   * @param {string} exchange
   * @param {string} group
   * @this {comq.features.Context}
   */
  async function (exchange, group) {
    await this.io.consume(exchange, group, async (payload) => {
      this.consumed ??= {}
      this.consumed[group] = payload

      await timeout(100)
    })
  })

When('I emit an event to the {token} exchange',
  /**
   * @param {string} exchange
   * @this {comq.features.Context}
   */
  async function (exchange) {
    const message = generate()

    await this.io.emit(exchange, message)

    this.published = message
  })

Then('{token} has received the event',
  /**
   * @param {string} group
   * @this {comq.features.Context}
   */
  async function (group) {
    await timeout(100)

    assert.notEqual(this.published, undefined, 'No event has been published')
    assert.equal(this.published, this.consumed[group], `'${group}' haven't consumed event`)
  })
