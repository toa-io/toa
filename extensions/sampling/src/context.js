'use strict'

const { Connector } = require('@toa.io/core')
const { match } = require('@toa.io/libraries/generic')
const { storage } = require('./storage')
const { ReplayException } = require('./exceptions')

/**
 * @implements {toa.core.Context}
 */
class Context extends Connector {
  /** @type {toa.core.Context} */
  #context

  constructor (context) {
    super()

    this.#context = context

    this.annexes = context.annexes
    this.depends(context)
  }

  async apply (endpoint, request) {
    const sample = /** @type {toa.sampling.sample.Context} */ storage.get()
    const calls = sample?.local?.[endpoint]

    if (calls !== undefined && calls.length > 0) {
      const call = calls.shift()
      const matches = match(request, call.request)

      if (matches === false) {
        throw new ReplayException(`Local '${endpoint}' call mismatch`)
      }

      if (call.reply !== undefined) return call.reply
    }

    return this.#context.apply(endpoint, request)
  }

  async call (namespace, name, endpoint, request) {
    return await this.#context.call(namespace, name, endpoint, request)
  }
}

exports.Context = Context
