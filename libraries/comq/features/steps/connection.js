'use strict'

const assert = require('node:assert')
const { timeout } = require('@toa.io/libraries/generic')

const { Given, When, Then } = require('@cucumber/cucumber')

Given('an active connection to {url}',
  /**
   * @param {string} url
   * @this {comq.features.Context}
   */
  async function (url) {
    await this.connect(url)
  })

When('I attempt to connect to {url} for {number} second(s)',
  /**
   * @param {string} url
   * @param {number} interval
   * @this {comq.features.Context}
   */
  async function (url, interval) {
    const wait = async () => await timeout(interval * 1000)

    await Promise.any([connect(this, url), wait()])
  })

When('I attempt to connect to {url}',
  /**
   * @param {string} url
   * @this {comq.features.Context}
   */
  async function (url) {
    await connect(this, url)
  })

Then('the connection is not established',
  /**
   * @this {comq.features.Context}
   */
  function () {
    assert.equal(this.io, undefined, 'connection is established contrary to expectations')
  })

Then('the connection is established',
  /**
   * @this {comq.features.Context}
   */
  function () {
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
   * @param {string} text
   * @this {comq.features.Context}
   */
  function (message) {
    assert.notEqual(this.exception, undefined, 'exception isn\'t thrown')

    assert.equal(this.exception.message.includes(message), true,
      'exception message mismatch ' + this.exception.message)
  })

/**
 * @param {comq.features.Context} context
 * @param {string} url
 * @returns {Promise<void>}
 */
const connect = async (context, url) => {
  try {
    await context.connect(url)
  } catch (exception) {
    context.exception = exception
  }
}
