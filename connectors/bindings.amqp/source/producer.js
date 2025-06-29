'use strict'

const { Connector } = require('@toa.io/core')
const { console } = require('openspan')

const { name } = require('./queues')

class Producer extends Connector {
  /** @type {toa.amqp.Communication} */
  #comm

  /** @type {toa.core.Locator} */
  #locator

  /** @type {string[]} */
  #endpoints

  /** @type {toa.core.Component} */
  #component

  constructor (comm, locator, endpoints, component) {
    super()

    this.#comm = comm
    this.#locator = locator
    this.#endpoints = endpoints
    this.#component = component

    this.depends(comm)
    this.depends(component)
  }

  async open () {
    await Promise.all(this.#endpoints.map((endpoint) => this.#endpoint(endpoint)))
  }

  async #endpoint (endpoint) {
    const queue = name(this.#locator, endpoint)
    const promises = [this.#comm.reply(queue, (request) => {
      console.debug('AMQP request received', { label: queue, request })

      return this.#component.invoke(endpoint, request)
    })]

    if (endpoint[0] !== '.')
      promises.push(this.#comm.process(queue + '..tasks', async (request) => {
        console.debug('AMQP task received', { label: queue, request })

        return await this.#component.invoke(endpoint, request)
      }))

    await Promise.all(promises)
  }
}

exports.Producer = Producer
