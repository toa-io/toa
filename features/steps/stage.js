import { Given, Then } from '@cucumber/cucumber'
import { serve, shutdown } from '@toa.io/userland/stage'

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
