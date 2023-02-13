'use strict'

const { AfterAll } = require('@cucumber/cucumber')
const { ConnectedWorld } = require('./world')

AfterAll(
  /**
   * @this {comq.features.Context}
   */
  async function () {
    await ConnectedWorld.disconnect()
  })
