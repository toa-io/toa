import { Readable, Transform, pipeline } from 'node:stream'
import timers from 'node:timers/promises'
import { Unroutable } from 'comq'
import { Connector, Encoded, exceptions } from '@toa.io/core'
import { publish } from './measurements.js'
import { ENDPOINT, resending } from './constants.js'
import * as stopping from './stopping.js'
import { instances, requests, tasks } from './queues.js'

/**
 * @implements {import('@toa.io/core/types').bindings.Consumer}
 */
export class Consumer extends Connector {
  /** @type {string} */
  #queue

  /** @type {string} */
  #tasksQueue

  /** @type {string} */
  #endpoint

  /** @type {string} */
  #exchange

  /** @type {string} */
  #id

  /** @type {toa.amqp.Communication} */
  #comm

  constructor(comm, locator, endpoint) {
    super()

    this.#queue = requests(locator)
    this.#tasksQueue = tasks(locator)
    this.#endpoint = endpoint
    this.#id = locator.id
    this.#exchange = instances(locator, endpoint)
    this.#comm = comm

    this.depends(comm)
  }

  async request(request, terms) {
    publish('request')

    const reply = await this.#send(request, terms)

    // an octet-stream reply is the bytes comq hands over, which is an output whoever answered
    // encoded for this caller to pass on
    if (Buffer.isBuffer(reply)) return { output: new Encoded(reply) }

    // and so is each value of a stream that answers a request asking for the bytes of them
    if (reply instanceof Readable && request?.encoded === true) return encodings(reply)

    return reply
  }

  async #send(request, terms) {
    // an ordinary call waits for its reply, and is handed no terms
    if (terms?.instance === undefined) return await this.#ordinary(request)

    try {
      return await this.#comm.call(
        this.#exchange,
        terms.instance,
        request,
        options(terms)
      )
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

  /**
   * Every call to a component arrives on one queue, so while a component is being replaced a
   * call to an operation only one of its two releases has may be taken by a process of the
   * other, which answers that it does not serve it. The call is sent again for whichever takes
   * it next, after a pause that grows. Once the pauses run out, or this process begins to stop,
   * no process has the operation as far as anybody can tell, and that is what its caller is told.
   */
  async #ordinary(request) {
    const properties = { headers: { [ENDPOINT]: this.#endpoint } }

    for (let attempt = 0; ; attempt++) {
      const reply = await this.#comm.request(this.#queue, request, properties)

      if (reply?.exception?.code !== exceptions.codes.Unserved) return reply

      const delay = resending(attempt)

      if (delay !== undefined && (await wait(delay))) continue

      return {
        exception: new exceptions.EndpointException(
          `'${this.#endpoint}' is not served by '${this.#id}'`
        )
      }
    }
  }

  async task(request) {
    publish('task')

    await this.#comm.enqueue(this.#tasksQueue, request, {
      headers: { [ENDPOINT]: this.#endpoint }
    })
  }
}

/**
 * Waits unless the process has begun to stop, and says whether it waited the whole of it.
 *
 * @param {number} delay
 * @returns {Promise<boolean>}
 */
async function wait(delay) {
  const signal = stopping.signal()

  if (signal.aborted) return false

  try {
    await timers.setTimeout(delay, undefined, { signal })

    return true
  } catch {
    return false
  }
}

/**
 * What comq is given of the terms. The name is the key a call is published under, and is no
 * option of it.
 *
 * @param {import('@toa.io/core/types').bindings.Terms} terms
 */
function options(terms) {
  if (terms.timeout === undefined && terms.signal === undefined) return undefined

  return { timeout: terms.timeout, signal: terms.signal }
}

/**
 * The values of a stream, each the bytes whoever answered encoded it into.
 *
 * @param {Readable} source
 * @returns {Readable}
 */
function encodings(source) {
  const wrapping = new Transform({
    objectMode: true,
    transform(value, _, callback) {
      callback(null, Buffer.isBuffer(value) ? new Encoded(value) : value)
    }
  })

  return pipeline(source, wrapping, noop)
}

// what `pipeline` reports is what each stream already carries to its reader
function noop() {}
