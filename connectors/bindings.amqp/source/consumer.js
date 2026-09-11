import { Unroutable } from 'comq'
import { Connector, exceptions } from '@toa.io/core'
import { instances, name } from './queues.js'

/**
 * @implements {import('@toa.io/core/types').bindings.Consumer}
 */
export class Consumer extends Connector {
  /** @type {string} */
  #queue

  /** @type {string} */
  #tasksQueue

  /** @type {string} */
  #exchange

  /** @type {toa.amqp.Communication} */
  #comm

  constructor(comm, locator, endpoint) {
    super()

    this.#queue = name(locator, endpoint)
    this.#tasksQueue = this.#queue + '..tasks'
    this.#exchange = instances(locator, endpoint)
    this.#comm = comm

    this.depends(comm)
  }

  async request(request, terms) {
    if (terms?.instance === undefined)
      return this.#comm.request(this.#queue, request, options(terms))

    try {
      return await this.#comm.call(this.#exchange, terms.instance, request, options(terms))
    } catch (exception) {
      if (!(exception instanceof Unroutable)) throw exception

      // answered rather than thrown, as a refusal the component raised would be
      return {
        exception: new exceptions.AddresseeException(
          `nothing holds '${terms.instance}' of '${this.#exchange}'`
        )
      }
    }
  }

  async task(request) {
    await this.#comm.enqueue(this.#tasksQueue, request)
  }
}

/**
 * What comq is given of the terms. The name is the key a call is published under, and is no
 * option of it.
 *
 * @param {import('@toa.io/core/types').bindings.Terms} [terms]
 */
function options(terms) {
  if (terms?.timeout === undefined && terms?.signal === undefined) return undefined

  return { timeout: terms.timeout, signal: terms.signal }
}
