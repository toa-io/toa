'use strict'

/**
 * @typedef {import('amqplib').ConsumeMessage} Message
 */

const { randomBytes } = require('node:crypto')
const { lazy, promise } = require('@toa.io/libraries/generic')

const { decode } = require('./decode')
const { encode } = require('./encode')
const { replies } = require('./.io/replies')

/**
 * @implements {toa.comq.IO}
 */
class IO {
  /** @type {toa.comq.Channel} */
  #in

  /** @type {toa.comq.Channel} */
  #out

  /** @type {toa.comq.Connection} */
  #connection

  /** @type {Record<string, toa.comq.Replies>} */
  #replies = {}

  /**
   * @param {toa.comq.Connection} connection
   */
  constructor (connection) {
    this.#connection = connection
  }

  reply = lazy(this, [this.#input, this.#output],
    /**
     * @param {string} queue
     * @param {toa.comq.producer} producer
     * @returns {Promise<void>}
     */
    async (queue, producer) => {
      return this.#in.consume(queue, true, this.#producer(producer))
    })

  request = lazy(this, [this.#output, this.#reply],
    /**
     * @param {string} queue
     * @param {any} payload
     * @param {string} [contentType]
     * @returns {Promise<void>}
     */
    async (queue, payload, contentType) => {
      const raw = Buffer.isBuffer(payload)

      contentType ??= raw ? OCTETS : MSGPACK

      const buffer = raw ? payload : encode(payload, contentType)
      const correlationId = randomBytes(8).toString('hex')
      const replies = this.#replies[queue]
      const replyTo = replies.queue
      const properties = { contentType, correlationId, replyTo }
      const reply = promise()

      replies.once(correlationId, reply.resolve)

      await this.#out.deliver(queue, buffer, properties)

      return reply
    })

  async close () {
    await this.#in?.close()
    await this.#out?.close()
    await this.#connection.close()
  }

  // region initializers

  async #input () {
    this.#in = await this.#connection.in()
  }

  async #output () {
    this.#out = await this.#connection.out()
  }

  async #reply (queue) {
    this.#replies[queue] = replies(queue)

    await this.#out.consume(this.#replies[queue].queue, false, this.#consumer(queue))
  }

  // endregion

  /**
   * @param {toa.comq.producer} producer
   * @returns {function(message: Message): Promise<void>}
   */
  #producer = (producer) =>
    async (message) => {
      if (!('replyTo' in message.properties)) throw new Error('Request is missing `replyTo` property')

      const payload = decode(message)
      const reply = await producer(payload)

      let { correlationId, contentType } = message.properties

      if (Buffer.isBuffer(reply)) contentType = OCTETS
      if (contentType === undefined) throw new Error('Reply to request without contentType must be of Buffer type')

      const buffer = contentType === OCTETS ? reply : encode(reply, contentType)
      const properties = { contentType, correlationId }

      await this.#out.deliver(message.properties.replyTo, buffer, properties)
    }

  /**
   * @param {string} queue
   * @returns {toa.comq.consumer}
   */
  #consumer = (queue) => {
    const replies = this.#replies[queue]

    return (message) => {
      const payload = decode(message)

      replies.emit(message.properties.correlationId, payload)
    }
  }
}

const OCTETS = 'application/octet-stream'
const MSGPACK = 'application/msgpack'

exports.IO = IO
