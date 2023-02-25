'use strict'

const amqp = require('amqplib')
const { retry } = require('@toa.io/libraries/generic')

const { Channel } = require('./channel')

/**
 * @implements {comq.Connection}
 */
class Connection {
  /** @type {string} */
  #url

  /** @type {import('amqplib').Connection} */
  #connection

  /**
   * @param {string} url
   */
  constructor (url) {
    this.#url = url
  }

  async connect () {
    console.log('Connecting...')

    await retry((retry) => this.#tryConnect(retry), RETRY)
  }

  async close () {
    await this.#connection.close()
  }

  async createInputChannel () {
    const chan = await this.#connection.createChannel()

    // it actually returns a Promise
    await chan.prefetch(300)

    return new Channel(chan)
  }

  async createOutputChannel () {
    const chan = await this.#connection.createConfirmChannel()

    return new Channel(chan)
  }

  /**
   * @param {Function} retry
   */
  async #tryConnect (retry) {
    try {
      this.#connection = await amqp.connect(this.#url)
    } catch (exception) {
      if (transient(exception)) return retry()
      else throw exception
    }

    // this.#connection.on('error', (e) => {
    //   console.log('error', e)
    // })
    //
    // this.#connection.on('close', (error) => {
    //   console.log('close', error.message)
    //   console.log(error)
    //
    //   this.connect()
    // })
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

  // didn't find anything reliable
  const HANDSHAKE = exception.message === 'Socket closed abruptly during opening handshake'

  return ECONNREFUSED || HANDSHAKE
}

exports.Connection = Connection
