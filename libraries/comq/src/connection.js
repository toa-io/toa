'use strict'

const { EventEmitter } = require('node:events')
const amqp = require('amqplib')
const { retry, promex } = require('@toa.io/libraries/generic')

const presets = require('./presets')
const channels = require('./channel')

/**
 * @implements {comq.Connection}
 */
class Connection {
  /** @type {string} */
  #url

  /** @type {import('amqplib').Connection} */
  #connection

  /** @type {comq.Channel[]} */
  #channels = []

  /** @type {toa.generic.Promex} */
  #recovery = promex()

  #diagnostics = new EventEmitter()

  /**
   * @param {string} url
   */
  constructor (url) {
    this.#url = url
  }

  async open () {
    await retry((retry) => this.#open(retry), RETRY)
  }

  async close () {
    await this.#connection.close()
  }

  async createChannel (type) {
    const preset = presets[type]

    const channel = await retry(async (retry) => this.#createChannel(retry, preset), { base: 0 })

    this.#channels.push(channel)

    return channel
  }

  async diagnose (event, listener) {
    this.#diagnostics.on(event, listener)
  }

  /**
   * @param {Function} retry
   */
  async #open (retry) {
    try {
      this.#connection = await amqp.connect(this.#url)
    } catch (exception) {
      if (transient(exception)) return retry()
      else throw exception
    }

    this.#connection.on('close', (error) => this.#close(error))

    // prevents process crash, 'close' will be emitted next
    // https://amqp-node.github.io/amqplib/channel_api.html#model_events
    this.#connection.on('error', () => undefined)
    this.#diagnostics.emit('open')

    for (const channel of this.#channels) await channel.recover(this.#connection)

    this.#recovery.resolve()
    this.#recovery = promex()
  }

  /**
   * @param {Error} error
   */
  async #close (error) {
    this.#diagnostics.emit('close', error)

    this.#connection.removeAllListeners()

    if (error !== undefined) await this.open()
  }

  /**
   * @param {Function} retry
   * @param {comq.Topology} preset
   * @return {Promise<comq.Channel>}
   */
  async #createChannel (retry, preset) {
    try {
      // await to catch rejection
      return await channels.create(this.#connection, preset)
    } catch {
      await this.#recovery

      retry()
    }
  }
}

/** @type {toa.generic.retry.Options} */
const RETRY = {
  retries: Infinity
}

/**
 * @param {Error} exception
 * @returns {boolean}
 */
const transient = (exception) => {
  const ECONNREFUSED = exception.code === 'ECONNREFUSED'
  const HANDSHAKE = exception.message === 'Socket closed abruptly during opening handshake'

  return ECONNREFUSED || HANDSHAKE
}

exports.Connection = Connection
