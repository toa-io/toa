'use strict'

const assert = require('node:assert')
const { timeout } = require('@toa.io/libraries/generic')

const { Given, When, Then } = require('@cucumber/cucumber')

Given('an active connection to the broker',
  /**
   * @this {comq.features.Context}
   */
  async function () {
    this.connecting = this.connect()

    await this.connecting
  })

When('I attempt to connect to the broker for {number} second(s)',
  /**
   * @param {number} interval
   * @this {comq.features.Context}
   */
  async function (interval) {
    const wait = async () => await timeout(interval * 1000)

    await Promise.any([connect(this), wait()])
  })

When('I attempt to connect to the broker',
  /**
   * @this {comq.features.Context}
   */
  async function () {
    await connect(this)
  })

When('I attempt to connect to the broker as {string} with password {string}',
  /**
   * @param {string} user
   * @param {string} password
   * @this {comq.features.Context}
   */
  async function (user, password) {
    await connect(this, user, password)
  })

Then('the connection is not established',
  /**
   * @this {comq.features.Context}
   */
  async function () {
    assert.equal(this.io, undefined, 'connection is established contrary to expectations')
  })

Then('the connection is established',
  /**
   * @this {comq.features.Context}
   */
  async function () {
    if (this.connecting) await this.connecting

    assert.notEqual(this.io, undefined, 'connection is not established')
  })

Then('no exceptions are thrown',
  /**
   * @this {comq.features.Context}
   */
  function () {
    assert.equal(this.exception, undefined, 'exception is thrown: ' + this.exception?.message)
  })

Then('an exception is thrown: {string}',
  /**
   * @param {string} message
   * @this {comq.features.Context}
   */
  function (message) {
    assert.notEqual(this.exception, undefined, 'exception isn\'t thrown')

    assert.equal(this.exception.message.includes(message), true,
      'exception message mismatch ' + this.exception.message)
  })

/**
 * @param {comq.features.Context} context
 * @param {string} [user]
 * @param {string} [password]
 * @returns {Promise<void>}
 */
const connect = async (context, user, password) => {
  try {
    await context.connect(user, password)
  } catch (exception) {
    context.exception = exception
  }
}
