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
 * @implements {toa.messenger.IO}
 */
class IO {
  /** @type {toa.messenger.Channel} */
  #in

  /** @type {toa.messenger.Channel} */
  #out

  /** @type {toa.messenger.Connection} */
  #connection

  /** @type {Record<string, toa.messenger.io.Replies>} */
  #replies = {}

  /**
   * @param {toa.messenger.Connection} connection
   */
  constructor (connection) {
    this.#connection = connection
  }

  reply = lazy(this, [this.#input, this.#output],
    /**
     * @param {string} queue
     * @param {toa.messenger.producer} producer
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
      const raw = Buffer.isBuffer(payload) || contentType === BUFFER

      contentType ??= raw ? BUFFER : MSGPACK

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

  /**
   * @param {toa.messenger.producer} producer
   * @returns {function(message: Message): Promise<void>}
   */
  #producer = (producer) =>
    /**
     * @param {Message} request
     * @returns {Promise<void>}
     */
    async (request) => {
      if (!('replyTo' in request.properties)) throw new Error('Request is missing `replyTo` property')

      const payload = decode(request)
      const reply = await producer(payload)

      let { correlationId, contentType } = request.properties

      if (Buffer.isBuffer(reply)) contentType = BUFFER
      if (contentType === undefined) throw new Error('Reply to request without contentType must be of Buffer type')

      const buffer = contentType === BUFFER ? reply : encode(reply, contentType)
      const properties = { contentType, correlationId }

      await this.#out.deliver(request.properties.replyTo, buffer, properties)
    }

  /**
   * @param {string} queue
   * @returns {toa.messenger.consumer}
   */
  #consumer = (queue) => {
    const replies = this.#replies[queue]

    return (message) => {
      // decode
      replies.emit(message.properties.correlationId, message.content)
    }
  }
}

const BUFFER = 'application/octet-stream'
const MSGPACK = 'application/msgpack'

exports.IO = IO
