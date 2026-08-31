'use strict'

const { After, When } = require('@cucumber/cucumber')
const { Wait, GenericContainer } = require('testcontainers')
const { setTimeout } = require('node:timers/promises')

When('I start docker container {component}',
  /**
   *
   * @param {string} container
   * @return {Promise<void>}
   */
  async function (container) {
    if (containersUpStrategies[container] === undefined) throw new Error('Unknown docker container')

    this.containers[container] = await containersUpStrategies[container]()
  })

When('I stop docker container {component}',
  /**
   *
   * @param {string} container
   * @return {Promise<void>}
   */
  async function (container) {
    if (this.containers[container] === undefined) throw new Error(`Container ${container} is not running`)

    await this.containers[container].stop({ timeout: 10000 })
    await setTimeout(50) // wait network to unbind the port
    delete this.containers[container]
  })

// a container left running keeps testcontainers' reaper connected, and the process alive
After(
  /**
   * @this {toa.features.Context}
   */
  async function () {
    for (const container of Object.values(this.containers))
      await container.stop({ timeout: 10000 })

    this.containers = {}
  })

const containersUpStrategies = {
  // a broker on the port the runtime expects, so that stopping it is an outage rather than a
  // misconfiguration
  rabbitmq: async function () {
    return new GenericContainer('rabbitmq:3.10.0-management')
      .withExposedPorts({
        container: 5672,
        host: 5673
      })
      .withEnvironment({
        RABBITMQ_DEFAULT_USER: 'developer',
        RABBITMQ_DEFAULT_PASS: 'secret'
      })
      .withWaitStrategy(Wait.forLogMessage('Server startup complete'))
      .withStartupTimeout(120000)
      .start()
  },
  mongodb: async function () {
    return new GenericContainer('mongo:5.0.8')
      .withExposedPorts({
        container: 27017,
        host: 27018
      })
      .withEnvironment({
        MONGO_INITDB_ROOT_USERNAME: 'testcontainersuser',
        MONGO_INITDB_ROOT_PASSWORD: 'secret'
      })
      .withWaitStrategy(Wait.forLogMessage('Waiting for connections'))
      .start()
  }
}
