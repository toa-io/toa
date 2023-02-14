'use strict'

const { timeout } = require('@toa.io/libraries/generic')
const { execute } = require('@toa.io/libraries/command')

const { Given } = require('@cucumber/cucumber')

Given('the RabbitMQ broker is {status}',
  /**
   * @param {'up' | 'down'} status
   * @this {comq.features.Context}
   */
  async function (status) {
    const command = status === 'up' ? 'start' : 'stop'

    await execute(`docker ${command} comq-rmq`)

    if (status === 'up') {
      await healthy()

      while (this.io === undefined) await timeout(1000)
    } else await timeout(1000)
  })

async function healthy () {
  let process

  do {
    await timeout(1000)

    process = await execute('docker inspect -f {{.State.Health.Status}} comq-rmq')
  } while (process.output !== 'healthy')
}
