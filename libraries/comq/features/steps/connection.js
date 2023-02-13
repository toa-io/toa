'use strict'

const assert = require('node:assert')
const { timeout } = require('@toa.io/libraries/generic')

const { Given, Then } = require('@cucumber/cucumber')

Given('active connection to {url}',
  /**
   * @param {string} url
   * @this {comq.features.Context}
   */
  async function (url) {
    await this.connect(url)
  })

Given('I\'m connecting to {url} for {number} second(s)',
  /**
   *
   * @param {string} url
   * @param {number} interval
   * @this {comq.features.Context}
   */
  async function (url, interval) {
    const connect = async () => {
      try {
        await this.connect(url)
      } catch (exception) {
        this.exception = exception
      }
    }

    const wait = async () => await timeout(interval * 1000)

    await Promise.any([connect(), wait()])
  })

Then('the connection hasn\'t been established',
  /**
   * @this {comq.features.Context}
   */
  function () {
    assert.equal(this.io, undefined, 'connection has been established contrary to expectations')
  })

Then('the connection has been established',
  /**
   * @this {comq.features.Context}
   */
  function () {
    assert.notEqual(this.io, undefined, 'connection has not been established')
  })

Then('no exceptions have been thrown',
  /**
   * @this {comq.features.Context}
   */
  function () {
    assert.equal(this.exception, undefined, 'exception has been thrown: ' + this.exception?.message)
  })
