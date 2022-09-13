'use strict'

const { Connector } = require('@toa.io/core')
const { match } = require('@toa.io/libraries/generic')
const { context } = require('./sample')
const { ReplayException } = require('./exceptions')

/**
 * @implements {toa.core.Context}
 */
class Context extends Connector {
  /** @type {toa.core.Context} */
  #context

  /**
   * @param {toa.core.Context} context
   * @param {toa.core.extensions.Annex[]} annexes
   */
  constructor (context, annexes) {
    super()

    this.annexes = annexes
    this.#context = context
    this.depends(context)
  }

  async apply (endpoint, request) {
    const sample = /** @type {toa.sampling.Sample} */ context.get()
    const requests = sample?.context?.local?.[endpoint]

    if (requests === undefined) return this.#context.apply(endpoint, request)
    else return this.#replay('apply', requests, [endpoint], request)
  }

  async call (namespace, name, endpoint, request) {
    const sample = /** @type {toa.sampling.Sample} */ context.get()
    const key = namespace + dot + name + dot + endpoint
    const requests = sample?.context?.remote?.[key]

    if (requests === undefined) return this.#context.call(namespace, name, endpoint, request)
    else return this.#replay('call', requests, [namespace, name, endpoint], request)
  }

  /**
   * @param {'apply' | 'call'} method
   * @param {toa.sampling.sample.Request[]} samples
   * @param {string[]} segments
   * @param {toa.core.Request} request
   * @returns {Promise<toa.core.Reply>}
   */
  async #replay (method, samples, segments, request) {
    const sample = samples.shift()

    if (sample.request !== undefined) {
      const matches = match(request, sample.request)

      if (matches === false) throw new ReplayException(`Call '${segments.join(dot)}' request mismatch`)
    }

    if (sample.reply !== undefined) return sample.reply
    else return this.#context[method](...segments, request)
  }
}

const dot = '.'

exports.Context = Context
