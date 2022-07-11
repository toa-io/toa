'use strict'

const { context: { set } } = require('@toa.io/libraries/kubernetes')
const { Given } = require('@cucumber/cucumber')

Given('I have a kube context {word}',
  /**
   * @param {string} context
   */
  async function (context) {
    await set(context)
  })
