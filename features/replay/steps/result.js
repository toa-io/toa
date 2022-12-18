'use strict'

const assert = require('node:assert').strict
const { Then } = require('@cucumber/cucumber')

Then('it passes',
  /**
   * @this {toa.samples.features.Context}
   */
  function () {
    assert.equal(this.ok, true)
  })

Then('it fails',
  /**
   * @this {toa.samples.features.Context}
   */
  function () {
    assert.equal(this.ok, false)
  })
