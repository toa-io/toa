'use strict'

const { Connector } = require('@toa.io/core')
const { newid } = require('@toa.io/libraries/generic')

const { context } = require('./sample')
const { validate } = require('./.component/validate')
const verify = require('./.component')

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

    // make sure State will request Storage
    if (sample.storage?.current !== undefined && rest.query === undefined) rest.query = { id: newid() }

    const reply = await context.apply(sample, () => this.#component.invoke(endpoint, rest))

    verify.reply(sample, reply, endpoint)
    verify.events(sample)

    return reply
  }
}

exports.Component = Component
