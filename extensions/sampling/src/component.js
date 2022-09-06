'use strict'

const { Connector } = require('@toa.io/core')
const { context } = require('@toa.io/libraries/generic')
const { validate, verify } = require('./schema')

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

    const storage = context(CONTEXT)

    await storage.apply(sample.context, async () => {
      reply = await this.#component.invoke(endpoint, rest)
    })

    verify(sample, reply)

    return reply
  }
}

const CONTEXT = 'sampling'

exports.Component = Component
