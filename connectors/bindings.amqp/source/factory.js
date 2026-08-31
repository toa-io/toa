'use strict'

const { Locator } = require('@toa.io/core')

const { Producer } = require('./producer')
const { Consumer } = require('./consumer')
const { Emitter } = require('./emitter')
const { Receiver } = require('./receiver')
const { Broadcast } = require('./broadcast')
const context = require('./deployment/context')
const sources = require('./deployment/sources')

const { SYSTEM } = require('./constants')
const { Communication } = require('./communication')

class Factory {
  /**
   * The communications in use, by what holds them. An IO opens a channel of its own for
   * requests, for replies and for events, and a connection has some two thousand
   * channels to give, so a connector cannot have a communication to itself.
   *
   * @type {Map<string, Communication>}
   */
  #communications = new Map()

  #serial = 0

  producer (locator, endpoints, component) {
    const comm = this.#communication(locator.id, context.resolveURIs(locator))

    return new Producer(comm, locator, endpoints, component)
  }

  consumer (locator, endpoint) {
    const comm = this.#communication(OUTBOUND, context.resolveURIs(locator))

    return new Consumer(comm, locator, endpoint)
  }

  emitter (locator, label) {
    const comm = this.#communication(locator.id, context.resolveURIs(locator))

    return new Emitter(comm, locator, label)
  }

  receiver (locator, label, group, receiver) {
    const references = locator.namespace === undefined
      ? sources.resolveURIs(locator)
      : context.resolveURIs(locator)

    /*
     * The locator names the component the events come *from*, while `group` names the one
     * that consumes them — and it is that component's teardown the sealing precedes.
     *
     * Receivers of one component share a communication with each other but not with that
     * component's producers, even though the two do stop consuming together. A delivery
     * calls an operation of the component it was received for, and that call is served by
     * those producers: sharing would have a receiver seal the very thing its own drain is
     * waiting on.
     */
    const comm = this.#communication(group === undefined ? this.#alone() : group + RECEIVING, references)

    return new Receiver(comm, label, group, receiver)
  }

  broadcast (name, group) {
    const locator = new Locator(name, SYSTEM)
    const owner = group === undefined ? this.#alone() : locator.id
    const comm = this.#communication(owner, context.resolveURIs(locator))

    return new Broadcast(comm, locator, group)
  }

  /**
   * The communication `owner` holds over `references`, made if there is none.
   *
   * Sealing stops every consumer of a communication at once and cannot be undone, so what
   * shares one must be what stops consuming together *and* needs nothing from the other:
   * a component's producers, or its receivers, but not both at once — see `receiver`.
   * Connectors that only publish are pooled apart, where nothing seals.
   *
   * @param {string} owner
   * @param {string[]} references
   * @returns {Communication}
   */
  #communication (owner, references) {
    const key = owner + SEPARATOR + references.join()
    const existing = this.#communications.get(key)

    // a sealed communication consumes nothing ever again, so it is never handed out
    if (existing !== undefined && !existing.sealed) return existing

    const communication = new Communication(references, () => {
      if (this.#communications.get(key) === communication) this.#communications.delete(key)
    })

    this.#communications.set(key, communication)

    return communication
  }

  /**
   * An owner of one connector.
   *
   * A subscription with no group consumes from an exclusive queue, and comq remembers
   * that queue by the exchange alone — two of them on one communication would share it,
   * and the broker would hand each event to only one of the two.
   *
   * @returns {string}
   */
  #alone () {
    return ALONE + ++this.#serial
  }
}

/** What connectors that only publish are pooled under. Nothing seals them. */
const OUTBOUND = '\u0000outbound'

const ALONE = '\u0000alone:'

const RECEIVING = ':receiving'
const SEPARATOR = '\u0000'

exports.Factory = Factory
