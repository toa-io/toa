'use strict'

const { Connector } = require('@toa.io/core')
const { match } = require('@toa.io/generic')
const { context } = require('./sample')
const { ReplayException, SampleException } = require('./exceptions')

/**
 * @implements {toa.core.Context}
 */
class Context extends Connector {
  /** @type {toa.core.Context} */
  #context

  /**
   * @param {toa.core.Context} context
   * @param {toa.core.extensions.Aspect[]} aspects
   */
  constructor (context, aspects) {
    super()

    this.aspects = aspects
    this.#context = context

    if (process.env.TOA_SAMPLING_AUTONOMOUS !== '1') this.depends(context)
  }

  async apply (endpoint, request) {
    const sample = /** @type {toa.sampling.request.Sample} */ context.get()
    const requests = sample?.context?.local?.[endpoint]
    const call = requests?.shift()

    return this.#replay('apply', call, [endpoint], request)
  }

  async call (namespace, name, endpoint, request) {
    const sample = /** @type {toa.sampling.request.Sample} */ context.get()
    const key = namespace + dot + name + dot + endpoint
    const requests = sample?.context?.remote?.[key]
    const call = requests?.shift()
    const segments = [namespace, name, endpoint]

    if (call?.reply === undefined && sample?.autonomous) {
      throw new SampleException(`autonomous sample is missing '${segments.join(dot)}' reply`)
    }

    return this.#replay('call', call, segments, request)
  }

  /**
   * @param {'apply' | 'call'} method
   * @param {toa.sampling.request.Sample} sample
   * @param {string[]} segments
   * @param {toa.core.Request} request
   * @returns {Promise<toa.core.Reply>}
   */
  async #replay (method, sample, segments, request) {
    if (sample?.request !== undefined) {
      const matches = match(request, sample.request)

      if (matches === false) throw new ReplayException(`Call '${segments.join(dot)}' request mismatch`, request, sample.request)
    }

    if (sample?.reply !== undefined) return this.#format(sample.reply)
    else return this.#context[method](...segments, request)
  }

  #format (reply) {
    if (reply.error !== undefined)
      return Object.create(Error.prototype, {
        message: { value: reply.error.message },
        cause: { value: reply.error.cause },
      })
    else
      return reply.output
  }
}

const dot = '.'

exports.Context = Context
