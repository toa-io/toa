'use strict'

/**
 * @typedef {import('amqplib').ConsumeMessage} Message
 */

const { randomBytes } = require('node:crypto')
const { lazy, promise } = require('@toa.io/libraries/generic')

const { decode } = require('./decode')
const { encode } = require('./encode')
const io = require('./.io')

/**
 * @implements {toa.comq.IO}
 */
class IO {
  /** @type {toa.comq.Connection} */
  #connection

  /** @type {toa.comq.Channel} */
  #input

  /** @type {toa.comq.Channel} */
  #output

  /** @type {Record<string, toa.comq.ReplyEmitter>} */
  #emitters = {}

  /**
   * @param {toa.comq.Connection} connection
   */
  constructor (connection) {
    this.#connection = connection
  }

  reply = lazy(this,
    [this.#createOutput, this.#createInput],
    /**
     * @param {string} queue
     * @param {toa.comq.producer} callback
     * @returns {Promise<void>}
     */
    async (queue, callback) => {
      const consumer = this.#getRequestConsumer(callback)

      await this.#input.consume(queue, true, consumer)
    })

  request = lazy(this,
    [this.#createOutput, this.#consumeReplies],
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
      const emitter = this.#emitters[queue]
      const replyTo = emitter.queue
      const properties = { contentType, correlationId, replyTo }
      const reply = promise()

      emitter.once(correlationId, reply.resolve)

      await this.#output.deliver(queue, buffer, properties)

      return reply
    })

  consume = lazy(this, this.#createInput,
    async (exchange, group, callback) => {
      const queue = io.concat(exchange, group)
      const consumer = this.#getMessageConsumer(callback)

      await this.#input.subscribe(exchange, queue, consumer)
    })

  async seal () {
    await this.#input?.close()

    this.#input = undefined
  }

  async close () {
    await this.#input?.close()
    await this.#output?.close()
    await this.#connection.close()
  }

  // region initializers

  async #createInput () {
    this.#input = await this.#connection.in()
  }

  async #createOutput () {
    this.#output = await this.#connection.out()
  }

  async #consumeReplies (queue) {
    const emitter = io.createReplyEmitter(queue)
    const consumer = this.#getReplyConsumer(queue, emitter)

    this.#emitters[queue] = emitter

    await this.#output.consume(emitter.queue, false, consumer)
  }

  // endregion

  /**
   * @param {toa.comq.producer} callback
   * @returns {toa.comq.channel.consumer}
   */
  #getRequestConsumer = (callback) =>
    async (message) => {
      if (!('replyTo' in message.properties)) throw new Error('Request is missing `replyTo` property')

      const payload = decode(message)
      const reply = await callback(payload)

      let { correlationId, contentType } = message.properties

      if (Buffer.isBuffer(reply)) contentType = OCTETS
      if (contentType === undefined) throw new Error('Reply to request without contentType must be of Buffer type')

      const buffer = contentType === OCTETS ? reply : encode(reply, contentType)
      const properties = { contentType, correlationId }

      await this.#output.send(message.properties.replyTo, buffer, properties)
    }

  /**
   * @param {string} queue
   * @param {toa.comq.ReplyEmitter} emitter
   * @returns {toa.comq.channel.consumer}
   */
  #getReplyConsumer = (queue, emitter) =>
    (message) => {
      const payload = decode(message)

      emitter.emit(message.properties.correlationId, payload)
    }

  /**
   * @param {toa.comq.consumer} callback
   * @returns {toa.comq.channel.consumer}
   */
  #getMessageConsumer = (callback) =>
    async (message) => {
      const payload = decode(message)

      await callback(payload)
    }
}

const OCTETS = 'application/octet-stream'
const MSGPACK = 'application/msgpack'

exports.IO = IO
