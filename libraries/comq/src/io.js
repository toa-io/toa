'use strict'

/**
 * @typedef {import('amqplib').ConsumeMessage} Message
 */

const { EventEmitter } = require('node:events')
const { randomBytes } = require('node:crypto')
const { lazy, track, promex } = require('@toa.io/libraries/generic')

const { decode } = require('./decode')
const { encode } = require('./encode')
const io = require('./.io')

/**
 * @implements {comq.IO}
 */
class IO {
  /** @type {comq.Connection} */
  #connection

  /** @type {comq.Channel} */
  #requests

  /** @type {comq.Channel} */
  #replies

  /** @type {comq.Channel} */
  #events

  #diagnostics = new EventEmitter()

  /** @type {Record<string, comq.ReplyEmitter>} */
  #emitters = {}

  /**
   * @param {comq.Connection} connection
   */
  constructor (connection) {
    this.#connection = connection

    for (const event of CONNECTION_EVENTS) {
      this.#connection.diagnose(event, (...args) => this.#diagnostics.emit(event, ...args))
    }
  }

  reply = lazy(this,
    [this.#createRequestReplyChannels],
    /**
     * @param {string} queue
     * @param {comq.producer} callback
     * @returns {Promise<void>}
     */
    async (queue, callback) => {
      const consumer = this.#getRequestConsumer(callback)

      await this.#requests.consume(queue, consumer)
    })

  request = lazy(this,
    [this.#createRequestReplyChannels, this.#consumeReplies],
    /**
     * @param {string} queue
     * @param {any} payload
     * @param {comq.encoding} [encoding]
     * @returns {Promise<void>}
     */
    async (queue, payload, encoding) => {
      const [buffer, contentType] = this.#encode(payload, encoding)
      const correlationId = randomBytes(8).toString('hex')
      const emitter = this.#emitters[queue]
      const replyTo = emitter.queue
      const properties = { contentType, correlationId, replyTo }
      const reply = promex()

      // memory leak in case of connection loss as reply will never be received
      emitter.once(correlationId, reply.resolve)

      await this.#requests.send(queue, buffer, properties)

      return reply
    })

  consume = lazy(this, this.#createEventChannel,
    async (exchange, group, callback) => {
      const queue = io.concat(exchange, group)
      const consumer = this.#getEventConsumer(callback)

      await this.#events.subscribe(exchange, queue, consumer)
    })

  emit = lazy(this, this.#createEventChannel,
    /**
     * @param {string} exchange
     * @param {any} payload
     * @param {comq.encoding} [encoding]
     * @returns {Promise<void>}
     */
    async (exchange, payload, encoding) => {
      const [buffer, contentType] = this.#encode(payload, encoding)
      const properties = { contentType }

      await this.#events.publish(exchange, buffer, properties)
    })

  async seal () {
    await this.#requests?.seal()
    await this.#events?.seal()

    this.#requests = undefined
    this.#events = undefined
  }

  async close () {
    await this.seal()
    await track(this)
    await this.#connection.close()
  }

  diagnose (event, handler) {
    this.#diagnostics.on(event, handler)
  }

  // region initializers

  async #createRequestReplyChannels () {
    this.#requests = await this.#createChannel('request')
    this.#replies = await this.#createChannel('reply')
  }

  async #createEventChannel () {
    this.#events = await this.#createChannel('event')
  }

  async #consumeReplies (queue) {
    const emitter = io.createReplyEmitter(queue)
    const consumer = this.#getReplyConsumer(queue, emitter)

    this.#emitters[queue] = emitter

    await this.#replies.consume(emitter.queue, consumer)
  }

  // endregion

  /**
   * @param {comq.topology.type} type
   * @returns {Promise<comq.Channel>}
   */
  async #createChannel (type) {
    const channel = await this.#connection.createChannel(type)

    channel.diagnose('flow', () => this.#diagnostics.emit('flow', type))
    channel.diagnose('drain', () => this.#diagnostics.emit('drain', type))

    return channel
  }

  /**
   * @param {comq.producer} callback
   * @returns {comq.channels.consumer}
   */
  #getRequestConsumer = (callback) =>
    track(this, async (message) => {
      if (!('replyTo' in message.properties)) throw new Error('Request is missing `replyTo` property')

      const payload = decode(message)
      const reply = await callback(payload)

      if (reply === undefined) throw new Error('Producer must return value')

      let { correlationId, contentType } = message.properties

      if (Buffer.isBuffer(reply)) contentType = OCTETS
      if (contentType === undefined) throw new Error('Reply to request without contentType must be of Buffer type')

      const buffer = contentType === OCTETS ? reply : encode(reply, contentType)
      const properties = { contentType, correlationId }

      await this.#replies.send(message.properties.replyTo, buffer, properties)
    })

  /**
   * @param {string} queue
   * @param {comq.ReplyEmitter} emitter
   * @returns {comq.channels.consumer}
   */
  #getReplyConsumer = (queue, emitter) =>
    (message) => {
      const payload = decode(message)

      emitter.emit(message.properties.correlationId, payload)
    }

  /**
   * @param {comq.consumer} callback
   * @returns {comq.channels.consumer}
   */
  #getEventConsumer = (callback) =>
    track(this, async (message) => {
      const payload = decode(message)

      await callback(payload)
    })

  /**
   * @param {any} payload
   * @param {comq.encoding} [contentType]
   * @returns [Buffer, string]
   */
  #encode (payload, contentType) {
    const raw = Buffer.isBuffer(payload)

    contentType ??= raw ? OCTETS : MSGPACK

    const buffer = raw ? payload : encode(payload, contentType)

    return [buffer, contentType]
  }
}

/** @type {comq.encoding} */
const OCTETS = 'application/octet-stream'

/** @type {comq.encoding} */
const MSGPACK = 'application/msgpack'

/** @type {comq.diagnostics.event[]} */
const CONNECTION_EVENTS = ['open', 'close']

exports.IO = IO
