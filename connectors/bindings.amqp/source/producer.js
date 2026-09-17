import { Connector, deliveries, instance } from '@toa.io/core'
import { console } from 'openspan'

import { ENDPOINT } from './constants.js'
import { instances, name, tasks } from './queues.js'
import { refuse, unserved } from './verdict.js'

export class Producer extends Connector {
  /** @type {toa.amqp.Communication} */
  #comm

  /** @type {import('@toa.io/core').Locator} */
  #locator

  /** @type {string[]} */
  #endpoints

  /** @type {import('@toa.io/core').Component} */
  #component

  /** @type {string[]} */
  #stateful

  /** @type {Set<Promise<any>>} */
  #pending = new Set()

  /**
   * The endpoints a task may name. A stateful one is absent: it is served under this process's
   * name, and a task is taken by whichever process is free.
   *
   * @type {Set<string>}
   */
  #served = new Set()

  // eslint-disable-next-line max-params
  constructor(comm, locator, endpoints, component, stateful = []) {
    super()

    this.#comm = comm
    this.#locator = locator
    this.#endpoints = endpoints
    this.#component = component
    this.#stateful = stateful

    this.depends(comm)
    this.depends(component)
  }

  /**
   * A stateful endpoint is served under this process's name before any other endpoint is served,
   * so that a name this process hands out in a reply is reachable by the time it arrives.
   */
  async open() {
    await Promise.all(this.#stateful.map((endpoint) => this.#addressed(endpoint)))

    const shared = this.#endpoints.filter((endpoint) => !this.#stateful.includes(endpoint))

    // an endpoint the runtime reserves for itself is served and takes no task, as it did
    // when the queue a task arrived on was named after the endpoint
    this.#served = new Set(shared.filter((endpoint) => endpoint[0] !== '.'))

    await Promise.all(shared.map((endpoint) => this.#endpoint(endpoint)))

    if (this.#served.size > 0) await this.#tasks()
  }

  /**
   * Stops consuming before the component it consumes for is taken apart.
   *
   * The component is a dependency, and a dependency is disconnected only once this has
   * returned — so what is closed here is closed while the component is still whole.
   * Sealing does not recall deliveries already dispatched, of which there can be as many
   * as the channel's prefetch, hence the wait for those still running.
   *
   * A message that arrives after this is left in its queue for whoever comes up next,
   * which is what a durable queue is for.
   */
  async close() {
    await this.#comm.seal()
    await Promise.allSettled(this.#pending)
  }

  /** Served under this process's name only: no queue of its own, and no tasks. */
  async #addressed(endpoint) {
    const exchange = instances(this.#locator, endpoint)

    await this.#comm.back(exchange, instance(), (request) => {
      console.debug('AMQP addressed request received', { label: exchange, request })

      return this.#invoke(endpoint, request)
    })
  }

  async #endpoint(endpoint) {
    const queue = name(this.#locator, endpoint)

    await this.#comm.reply(queue, (request) => {
      console.debug('AMQP request received', { label: queue, request })

      return this.#invoke(endpoint, request)
    })
  }

  /**
   * One queue for every task this component is given: the message names the operation, so the
   * queue does not have to, and the broker holds one of them rather than one per operation.
   */
  async #tasks() {
    const queue = tasks(this.#locator)

    await this.#comm.process(queue, async (request, properties) => {
      const endpoint = properties?.headers?.[ENDPOINT]

      console.debug('AMQP task received', { label: queue, endpoint, request })

      // a caller running ahead of this process names an operation it does not serve, and
      // trying the message again cannot make it known
      if (!this.#served.has(endpoint)) unserved(endpoint)

      const reply = await this.#invoke(endpoint, request)

      /*
       * A task is a call with nobody waiting for it, so the runtime reads the reply that
       * caller would have read. An exception is not an answer: raising it here is what
       * brings the message back, where acknowledging it would end the work silently.
       *
       * A declared error is an answer, and is acknowledged like any other.
       */
      if (reply?.exception !== undefined) refuse(reply.exception)

      return reply
    })
  }

  /**
   * Invokes the component, counting the call in while it runs. See .close()
   *
   * Counted for the process as well, where what is in flight is read as one number: this is
   * the whole of what a request, an addressed request and a task have in common, so counting
   * here counts all three.
   */
  async #invoke(endpoint, request) {
    const promise = this.#component.invoke(endpoint, request)

    this.#pending.add(promise)
    deliveries.taken()

    try {
      const reply = await promise

      return request?.encoded === true ? encoded(reply) : reply
    } finally {
      this.#pending.delete(promise)
      deliveries.done()
    }
  }
}

/**
 * An output its caller reads as bytes: comq sends a Buffer as it is, so what the caller writes on
 * — a response body — is encoded once, here, and read by nobody in between. Everything else
 * travels as the reply it is: an error and an exception are read, a stream is framed, and an
 * absent output is what a caller answers nothing for.
 *
 * @param {any} reply
 * @returns {any}
 */
function encoded(reply) {
  if (reply === null || typeof reply !== 'object' || Buffer.isBuffer(reply)) return reply
  if (reply.error !== undefined || reply.exception !== undefined) return reply

  const output = reply.output

  if (output === undefined || output === null || typeof output !== 'object') return reply

  return Buffer.from(JSON.stringify(output))
}
