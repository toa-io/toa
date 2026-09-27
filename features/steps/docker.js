import { After, When } from '@cucumber/cucumber'
import { Wait, GenericContainer } from 'testcontainers'
import { setTimeout } from 'node:timers/promises'

When(
  'I start docker container {component}',
  /**
   *
   * @param {string} container
   * @return {Promise<void>}
   */
  async function (container) {
    if (containersUpStrategies[container] === undefined)
      throw new Error('Unknown docker container')

    this.containers[container] = await containersUpStrategies[container]()
  }
)

When(
  'I stop docker container {component}',
  /**
   *
   * @param {string} container
   * @return {Promise<void>}
   */
  async function (container) {
    if (this.containers[container] === undefined)
      throw new Error(`Container ${container} is not running`)

    await this.containers[container].stop({ timeout: 10000 })
    await setTimeout(50) // wait network to unbind the port
    delete this.containers[container]
  }
)

// a container left running keeps testcontainers' reaper connected, and the process alive
After(
  /**
   * @this {toa.features.Context}
   */
  async function () {
    for (const container of Object.values(this.containers))
      await container.stop({ timeout: 10000 })

    this.containers = {}
  }
)

const containersUpStrategies = {
  // a broker on the port the runtime expects, so that stopping it is an outage rather than a
  // misconfiguration
  rabbitmq: async function () {
    return new GenericContainer('rabbitmq:3.10.0-management')
      .withExposedPorts({
        container: 5672,
        host: 31012
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
        host: 31021
      })
      .withEnvironment({
        MONGO_INITDB_ROOT_USERNAME: 'testcontainersuser',
        MONGO_INITDB_ROOT_PASSWORD: 'secret'
      })
      .withWaitStrategy(Wait.forLogMessage('Waiting for connections'))
      .start()
  },
  // a replica set of its own, with the least history MongoDB keeps, so that a scenario can
  // outlast it without doing that to the stack every other scenario reads
  'mongodb-rs': async function () {
    const container = await new GenericContainer('mongo:8.0.16')
      .withExposedPorts({
        container: 31022,
        host: 31022
      })
      .withCommand(['--replSet', 'rs', '--port', '31022', '--bind_ip_all', '--oplogSize', '990'])
      .withWaitStrategy(Wait.forLogMessage('Waiting for connections'))
      .start()

    const initiate = 'rs.initiate({ _id: "rs", members: [{ _id: 0, host: "localhost:31022" }] })'

    await container.exec(['mongosh', '--port', '31022', '--quiet', '--eval', initiate])

    for (let attempt = 0; attempt < 100; attempt++) {
      const { output } = await container.exec([
        'mongosh', '--port', '31022', '--quiet', '--eval', 'db.hello().isWritablePrimary'
      ])

      if (output.trim() === 'true') return container

      await setTimeout(200)
    }

    throw new Error('The replica set elected no primary')
  }
}
