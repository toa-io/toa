'use strict'

const { Given } = require('@cucumber/cucumber')

Given('I consume events from {token} exchange as {token}',
  /**
   * @param {string} exchange
   * @param {string} group
   * @this {comq.features.Context}
   */
  async function (exchange, group) {
    await this.io.consume(exchange, group, (payload) => {
      this.events ??= {}
      this.events[group] = payload
    })
  })
