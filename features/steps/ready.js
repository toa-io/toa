'use strict'

const assert = require('node:assert')
const { When, Then } = require('@cucumber/cucumber')

const PORT = 8001
const PATH = '/.ready'

When('I request ready probe',
  /**
   * @this {toa.features.Context}
   */
  async function () {
    const response = await fetch(`http://127.0.0.1:${PORT}${PATH}`)

    this.readyProbe = {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    }
  })

Then('ready probe status is {int}',
  /**
   * @param {number} status
   * @this {toa.features.Context}
   */
  function (status) {
    assert.ok(this.readyProbe !== undefined, 'Ready probe was not requested')
    assert.equal(this.readyProbe.status, status)

    if (status === 200)
      assert.equal(this.readyProbe.headers['cache-control'], 'no-store')
  })
