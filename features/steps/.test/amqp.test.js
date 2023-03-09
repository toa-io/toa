'use strict'

const { dump } = require('@toa.io/yaml')

const { gherkin } = require('@toa.io/mock')
const { amqp } = require('./amqp.fixtures')

const mock = { gherkin, amqp }

jest.mock('@cucumber/cucumber', () => mock.gherkin)
jest.mock('amqplib', () => mock.amqp)

require('../amqp')
const { generate } = require('randomstring')

describe('When I publish to a(n) {word} exchange a message:', () => {
  const step = gherkin.steps.Wh('I publish to a(n) {word} exchange a message:')

  it('should be', () => undefined)

  /** @type {toa.features.Context} */
  let context

  const exchange = generate()
  const message = { [generate()]: generate() }
  const yaml = dump(message)

  beforeEach(() => {
    jest.clearAllMocks()

    context = {}
  })

  it('should connect', async () => {
    await step.call(context, exchange, yaml)

    expect(amqp.connect).toHaveBeenCalledWith('amqp://developer:secret@localhost')

    const connection = await amqp.connect.mock.results[0].value

    expect(context.amqp.connection).toStrictEqual(connection)
    expect(connection.createChannel).toHaveBeenCalled()

    const channel = await connection.createChannel.mock.results[0].value

    expect(channel).toBeDefined()

    expect(context.amqp.channel).toStrictEqual(channel)
  })

  it('should not connect twice', async () => {
    await step.call(context, exchange, yaml)
    await step.call(context, exchange, yaml)

    expect(amqp.connect).toHaveBeenCalledTimes(1)
  })

  describe('publishing', () => {
    let connection
    let channel

    beforeEach(async () => {
      await step.call(context, exchange, yaml)

      connection = await amqp.connect.mock.results[0].value
      channel = await connection.createChannel.mock.results[0].value
    })

    it('should assert exchange', async () => {
      expect(channel.assertExchange).toHaveBeenCalledWith(exchange, 'fanout', { durable: true })
    })

    it('should publish', () => {
      const json = JSON.stringify(message)
      const buffer = Buffer.from(json)

      expect(channel.publish).toHaveBeenCalledWith(exchange, '', buffer)
    })
  })
})
