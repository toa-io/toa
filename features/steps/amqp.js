'use strict'

const amqp = require('amqplib')
const { parse } = require('@toa.io/yaml')

const { When } = require('@cucumber/cucumber')

When('I publish to a(n) {word} exchange a message:',
  /**
   * @param {string} exchange
   * @param {string} yaml
   * @this {toa.features.Context}
   */
  async function (exchange, yaml) {
    if (this.amqp === undefined) this.amqp = await connect()

    const channel = this.amqp.channel
    await channel.assertExchange(exchange, 'fanout', { durable: true })

    const message = parse(yaml)
    const json = JSON.stringify(message)
    const buffer = Buffer.from(json)

    channel.publish(exchange, '', buffer)
  })

/**
 * @return {Promise<toa.features.context.AMQP>}
 */
const connect = async () => {
  const connection = await amqp.connect('amqp://developer:secret@localhost')
  const channel = await connection.createChannel()

  return { connection, channel }
}
