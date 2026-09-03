import { Connector } from '@toa.io/core'
import { name } from './queues.js'

/**
 * @implements {toa.core.bindings.Consumer}
 */
export class Consumer extends Connector {
  /** @type {string} */
  #queue

  /** @type {string} */
  #tasksQueue

  /** @type {toa.amqp.Communication} */
  #comm

  constructor (comm, locator, endpoint) {
    super()

    this.#queue = name(locator, endpoint)
    this.#tasksQueue = this.#queue + '..tasks'
    this.#comm = comm

    this.depends(comm)
  }

  async request (request) {
    return this.#comm.request(this.#queue, request)
  }

  async task (request) {
    await this.#comm.enqueue(this.#tasksQueue, request)
  }
}
