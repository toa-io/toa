'use strict'

const { timeout } = require('@toa.io/generic')

const { When, Then } = require('@cucumber/cucumber')
const assert = require('node:assert')

When('I wait {float} second(s)',
  async function (seconds) {
    await timeout(seconds * 1000)
  })

Then('a failure is expected', function() {
  this.failureAwait = true
})

Then('it fails with:', function(exception) {
  assert.equal(exception, this.exception?.message, 'Unexpected exception value')
})