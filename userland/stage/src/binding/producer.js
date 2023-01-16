'use strict'

const { Connector } = require('@toa.io/core')

const { binding } = require('./binding')
const { label } = require('./label')

/**
 * @implements {toa.core.Connector}
 */
class Producer extends Connector {
  /** @type {toa.core.Locator} */
  #locator

  /** @type {string[]} */
  #endpoints

  /** @type {toa.core.Component} */
  #component

  /**
   * @param {toa.core.Locator} locator
   * @param {string[]} endpoints
   * @param {toa.core.Component} component
   */
  constructor (locator, endpoints, component) {
    super()

    this.#locator = locator
    this.#endpoints = endpoints
    this.#component = component
  }

  async connection () {
    for (const endpoint of this.#endpoints) {
      const command = label(this.#locator, endpoint)

      await binding.reply(command, (request) => this.#component.invoke(endpoint, request))
    }
  }
}

exports.Producer = Producer
