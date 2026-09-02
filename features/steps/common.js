import { timeout } from '@toa.io/generic'

import { When } from '@cucumber/cucumber'

When('I wait {float} second(s)',
  async function (seconds) {
    await timeout(seconds * 1000)
  })
