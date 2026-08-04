'use strict'

const { assert } = require('comq')
const { Connector } = require('@toa.io/core')
const { console } = require('openspan')

class Communication extends Connector {
  #resolve

  /** @type {comq.IO} */
  #io

  constructor (resolve) {
    super()

    this.#resolve = resolve
  }

  async open () {
    const references = await this.#resolve()

    this.#io = await assert(...references)

    // `assert` shares one connection per broker, while every connector gets its own
    // IO, so diagnosing here unconditionally would log each event once per connector
    const key = references.join()

    if (!diagnosed.has(key)) {
      diagnosed.add(key)
      this.#diagnose()
    }
  }

  async close () {
    await this.#io?.seal()
  }

  async dispose () {
    await this.#io?.close()
  }

  async reply (queue, process) {
    await this.#io.reply(queue, process)
  }

  async request (queue, request) {
    return this.#io.request(queue, request)
  }

  async emit (exchange, message, properties) {
    await this.#io.emit(exchange, message, properties)
  }

  async consume (exchange, group, consumer) {
    await this.#io.consume(exchange, group, consumer)
  }

  async process (queue, consumer) {
    await this.#io.process(queue, consumer)
  }

  async enqueue (queue, message) {
    await this.#io.enqueue(queue, message)
  }

  /**
   * Without this, an undeliverable message, a discarded request or a shard
   * dropping out leave no trace at all.
   */
  #diagnose () {
    this.#io.diagnose('return', (type, message, shard) =>
      console.error('AMQP message returned', {
        type,
        queue: message.fields?.routingKey,
        correlationId: message.properties?.correlationId,
        shard
      }))

    this.#io.diagnose('discard', (type, message, exception, shard) =>
      console.error('AMQP message discarded', {
        type,
        queue: message.fields?.routingKey,
        message: exception?.message,
        shard
      }))

    this.#io.diagnose('remove', (type, shard) =>
      console.warn('AMQP shard removed', { type, shard }))

    this.#io.diagnose('recover', (type, shard) =>
      console.info('AMQP channel recovered', { type, shard }))

    this.#io.diagnose('flow', (type, shard) =>
      console.warn('AMQP back pressure', { type, shard }))

    this.#io.diagnose('drain', (type, shard) =>
      console.info('AMQP back pressure released', { type, shard }))

    this.#io.diagnose('close', (error, shard) => {
      if (error === undefined)
        console.debug('AMQP connection closed', { shard })
      else
        console.warn('AMQP connection lost', { message: error.message, shard })
    })

    this.#io.diagnose('open', (shard) =>
      console.debug('AMQP connection open', { shard }))
  }
}

/** @type {Set<string>} */
const diagnosed = new Set()

exports.Communication = Communication
