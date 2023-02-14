'use strict'

const assert = require('node:assert')
const { generate } = require('randomstring')
const { timeout } = require('@toa.io/libraries/generic')
const { Given, When, Then } = require('@cucumber/cucumber')

Given('(that ){token} is consuming events from the {token} exchange',
  /**
   * @param {string} group
   * @param {string} exchange
   * @this {comq.features.Context}
   */
  async function (group, exchange) {
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

Then('{token} receives the event',
  /**
   * @param {string} group
   * @this {comq.features.Context}
   */
  async function (group) {
    await timeout(100)

    assert.notEqual(this.published, undefined, 'No event has been published')
    assert.equal(this.published, this.consumed[group], `'${group}' haven't consumed event`)
  })
