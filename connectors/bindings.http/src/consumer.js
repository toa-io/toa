'use strict'

const fetch = require('node-fetch')
const { Connector } = require('@kookaburra/core')

const resource = require('./resource')

class Consumer extends Connector {
  #agent
  #locator
  #endpoint
  #url

  constructor (agent, locator, endpoint) {
    super()

    this.#agent = agent
    this.#locator = locator
    this.#endpoint = endpoint
  }

  async connection () {
    this.#url = Consumer.#locate(this.#locator, this.#endpoint)
  }

  async request (request) {
    const method = resource.method

    const reply = await fetch(this.#url, {
      method,
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
      agent: this.#agent
    })

    return reply.json()
  }

  static #locate (locator, endpoint) {
    const host = process.env.KOO_ENV === 'dev' ? 'localhost' : locator.host()
    const path = resource.path(locator, endpoint)

    return 'http://' + host + ':' + PORT + path
  }
}

const PORT = 3000

exports.Consumer = Consumer
