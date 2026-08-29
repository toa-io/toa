'use strict'

const { assert } = require('comq')
const { Connector } = require('@toa.io/core')
const { console } = require('openspan')

class Communication extends Connector {
  /** @type {string[]} */
  #references

  /** @type {() => void} */
  #evict

  /** @type {comq.IO} */
  #io

  #sealed = false

  /**
   * @param {string[]} references the brokers this communication is held over
   * @param {() => void} [evict] tells whoever caches this one that it is going
   */
  constructor (references, evict = noop) {
    super()

    this.#references = references
    this.#evict = evict
  }

  /** Whether this communication has stopped consuming, for good. */
  get sealed () {
    return this.#sealed
  }

  async open () {
    this.#io = await assert(...this.#references)

    // `assert` shares one connection per broker while handing out an IO of its own,
    // and a broker set is held by several communications, so diagnosing here
    // unconditionally would log each event once per holder
    const key = this.#references.join()

    if (!diagnosed.has(key)) {
      diagnosed.set(key, this)
      this.#diagnose()
    }
  }

  /**
   * Stops consuming, leaving publishing open until the connection is disposed of.
   *
   * A connector that consumes for something it depends on seals here rather than waiting
   * for its own disconnection to reach this one: a dependency is torn down after its
   * dependant, so by then it would be too late.
   */
  async seal () {
    this.#sealed = true

    await this.#io?.seal()
  }

  async close () {
    // nobody may be handed a communication that is on its way out
    this.#evict()

    await this.seal()
  }

  async dispose () {
    this.#evict()

    // the duty of reporting this broker set passes to whoever holds it next
    const key = this.#references.join()

    if (diagnosed.get(key) === this) diagnosed.delete(key)

    await this.#io?.close()
  }

  async reply (queue, process) {
    this.#consumable('reply to')

    await this.#io.reply(queue, process)
  }

  async request (queue, request) {
    return this.#io.request(queue, request)
  }

  async emit (exchange, message, properties) {
    await this.#io.emit(exchange, message, properties)
  }

  async consume (exchange, group, consumer) {
    this.#consumable('consume')

    await this.#io.consume(exchange, group, consumer)
  }

  async process (queue, consumer) {
    this.#consumable('process')

    await this.#io.process(queue, consumer)
  }

  async enqueue (queue, message) {
    await this.#io.enqueue(queue, message)
  }

  /**
   * A sealed communication registers a consumer that never consumes, silently. Whoever
   * asks one to is holding a reference to something that has already gone, and is told.
   *
   * @param {string} operation
   */
  #consumable (operation) {
    if (this.#sealed)
      throw new Error(`AMQP communication is sealed and cannot ${operation} '${this.#references.join()}'`)
  }

  /**
   * Without this, an undeliverable message, a discarded request, a shard
   * dropping out or a failed reconnect leave no trace at all.
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

    this.#io.diagnose('lost', (type, shard) =>
      console.warn('AMQP shard lost', { type, shard }))

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

    this.#io.diagnose('error', (error, shard) =>
      console.warn('AMQP connection failed', { message: error.message, shard }))

    this.#io.diagnose('reconnect', (shard) =>
      console.warn('AMQP reconnecting', { shard }))

    // not transient and not self-healing: every later channel creation fails too
    this.#io.diagnose('exhausted', (limit, shard) =>
      console.error('AMQP channels exhausted', { limit, shard }))

    this.#io.diagnose('open', (shard) =>
      console.debug('AMQP connection open', { shard }))
  }
}

/**
 * Who reports the events of a broker set, by the set. One holder does it for all of
 * them, and hands the duty over when it goes.
 *
 * @type {Map<string, Communication>}
 */
const diagnosed = new Map()

function noop () {}

exports.Communication = Communication
