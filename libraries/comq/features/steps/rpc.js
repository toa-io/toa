'use strict'

const assert = require('node:assert')
const { join } = require('node:path')
const { parse } = require('@toa.io/libraries/yaml')
const { match } = require('@toa.io/libraries/generic')
const { Given, When, Then } = require('@cucumber/cucumber')

Given('producer {token} is replying {token} queue',
  /**
   * @param {string} name
   * @param {string} queue
   * @this {toa.comq.features.Context}
   */
  async function (name, queue) {
    const path = join(PRODUCERS, name)
    const mod = require(path)
    const producer = mod[name]

    await this.io.reply(queue, producer)
  })

When('I send following request to {token} queue:',
  /**
   * @param {string} queue
   * @param {string} yaml
   * @this {toa.comq.features.Context}
   */
  async function (queue, yaml) {
    const payload = parse(yaml)

    this.reply = await this.io.request(queue, payload)
  })

Then('I get the reply:',
  /**
   * @param {string} yaml
   * @this {toa.comq.features.Context}
   */
  function (yaml) {
    const value = parse(yaml)
    const matches = match(this.reply, value)

    assert.equal(matches, true, 'Reply mismatch')
  })

const PRODUCERS = join(__dirname, 'producers')
