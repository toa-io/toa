import { Connector } from '@toa.io/core'
import { console } from 'openspan'

import { name } from './queues.js'
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

  /** @type {Set<Promise<any>>} */
  #pending = new Set()

  constructor(comm, locator, endpoints, component) {
    super()

    this.#comm = comm
    this.#locator = locator
    this.#endpoints = endpoints
    this.#component = component

    this.depends(comm)
    this.depends(component)
  }

  async open() {
    await Promise.all(this.#endpoints.map((endpoint) => this.#endpoint(endpoint)))
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
      return await promise
    } finally {
      this.#pending.delete(promise)
    }
  }
}
