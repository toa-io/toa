'use strict'

const assert = require('node:assert')
const { parse } = require('@toa.io/libraries/yaml')
const { match } = require('@toa.io/libraries/generic')
const { Given, When, Then } = require('@cucumber/cucumber')

Given('function replying {token} queue:',
  /**
   * @param {string} queue
   * @param {string} javascript
   * @this {comq.features.Context}
   */
  async function (queue, javascript) {
    // eslint-disable-next-line no-new-func
    const producer = new Function('return ' + javascript)()

    await this.io.reply(queue, producer)
  })

Given('function replying {token} queue is expected:',
  /**
   * @param {string} queue
   * @param {string} javascript
   * @this {comq.features.Context}
   */
  async function (queue, javascript) {
    // eslint-disable-next-line no-new-func
    const producer = new Function('return ' + javascript)()

    this.expected = this.io.reply(queue, producer)
  })

When('the consumer sends the following request to the {token} queue:',
  /**
   * @param {string} queue
   * @param {string} yaml
   * @this {comq.features.Context}
   */
  async function (queue, yaml) {
    const payload = parse(yaml)

    if (this.expected) await this.expected

    this.reply = this.io.request(queue, payload)
  })

Then('the consumer receives the reply:',
  /**
   * @param {string} yaml
   * @this {comq.features.Context}
   */
  async function (yaml) {
    const value = parse(yaml)
    const reply = await this.reply
    const matches = match(reply, value)

    assert.equal(matches, true, 'Reply mismatch')
  })
