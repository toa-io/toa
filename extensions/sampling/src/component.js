'use strict'

const { Connector } = require('@toa.io/core')
const { match } = require('@toa.io/libraries/generic')
const { validate } = require('./schema')
const { ReplayException } = require('./exceptions')
const { context } = require('./sample')

/**
 * @implements {toa.core.Component}
 */
class Component extends Connector {
  /** @type {toa.core.Locator} */
  locator

  /** @type {toa.core.Component} */
  #component

  /**
   * @param {toa.core.Component} component
   */
  constructor (component) {
    super()

    this.locator = component.locator
    this.#component = component

    this.depends(component)
  }

  async invoke (endpoint, request) {
    if (request.sample === undefined) return this.#component.invoke(endpoint, request)

    const { sample, ...rest } = request

    validate(sample)

    let reply

    await context.apply(sample, async () => {
      reply = await this.#component.invoke(endpoint, rest)
    })

    verify(sample, reply, endpoint)

    return reply
  }
}

/**
 * @param {toa.sampling.Sample} sample
 * @param {toa.core.Reply} reply
 * @param {string} endpoint
 */
const verify = (sample, reply, endpoint) => {
  if (sample.reply === undefined) return

  if (reply.exception !== undefined) {
    throw new Error(`Operation '${endpoint}' has thrown an exception ` + `(${reply.exception.code}) ${reply.exception.message}`)
  }

  const matches = match(reply, sample.reply)

  if (matches === false) reply.exception = new ReplayException(`Operation '${endpoint}' reply mismatch`)
}

exports.Component = Component
