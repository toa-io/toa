'use strict'

const { execute } = require('@toa.io/libraries/command')

const { Given } = require('@cucumber/cucumber')

Given('RabbitMQ broker is {status}',
  /**
   * @param {'up' | 'down'} status
   */
  async function (status) {
    const command = status === 'up' ? 'start' : 'stop'

    await execute(`docker ${command} comq-rmq`)
  })
