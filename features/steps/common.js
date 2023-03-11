'use strict'

const { timeout } = require('@toa.io/generic')

const { When } = require('@cucumber/cucumber')

When('I wait {float} second(s)',
  async function (seconds) {
    await timeout(seconds * 1000)
  })
