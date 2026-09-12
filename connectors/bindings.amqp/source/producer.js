import { Connector, instance } from '@toa.io/core'
import { console } from 'openspan'

import { instances, name } from './queues.js'
import { refuse } from './verdict.js'

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

    await Promise.all(shared.map((endpoint) => this.#endpoint(endpoint)))
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
    const promises = [
      this.#comm.reply(queue, (request) => {
        console.debug('AMQP request received', { label: queue, request })

        return this.#invoke(endpoint, request)
      })
    ]

    if (endpoint[0] !== '.')
      promises.push(
        this.#comm.process(queue + '..tasks', async (request) => {
          console.debug('AMQP task received', { label: queue, request })

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
      )

    await Promise.all(promises)
  }

  /** Invokes the component, counting the call in while it runs. See .close() */
  async #invoke(endpoint, request) {
    const promise = this.#component.invoke(endpoint, request)

    this.#pending.add(promise)

    try {
      const reply = await promise

      return request?.encoded === true ? encoded(reply) : reply
    } finally {
      this.#pending.delete(promise)
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
