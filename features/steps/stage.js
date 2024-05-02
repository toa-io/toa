'use strict'

const { Given, Then } = require('@cucumber/cucumber')
const { serve, shutdown } = require('@toa.io/userland/stage')

Given('the {token} service is staged',
  /**
   * @param {string} ref
   * @this {toa.features.Context}
   */
  async function(ref) {
    await serve(ref)
  })

Then('the stage is stopped',
  async function() {
    await shutdown()
  })
