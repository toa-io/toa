'use strict'

const { When } = require('@cucumber/cucumber')
const { Wait, GenericContainer } = require("testcontainers")

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
    // wait network to unbind port
    await new Promise(resolve => setTimeout(resolve, 50))
    delete this.containers[container]
  })

const containersUpStrategies = {
  mongodb: async function() {
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