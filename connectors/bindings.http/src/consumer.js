'use strict'

const fetch = require('node-fetch')
const { Connector } = require('@kookaburra/core')

const resource = require('./resource')

class Consumer extends Connector {
  #agent
  #locator

  constructor (agent, locator) {
    super()

    this.#agent = agent
    this.#locator = locator
  }

  async request (endpoint, request) {
    const method = resource.method
    const url = this.#url(endpoint)

    const reply = await fetch(url, {
      method,
      body: JSON.stringify(request),
      headers: { 'Content-Type': 'application/json' },
      agent: this.#agent
    })

    return reply.json()
  }

  #url (endpoint) {
    const host = process.env.KOO_ENV === 'dev' ? 'localhost' : this.#locator.host()
    const path = resource.path(this.#locator, endpoint)
    const port = process.env.__INTEGRATION_HTTP_SERVER_PORT || PORT

    return 'http://' + host + ':' + port + path
  }
}

const PORT = 80

exports.Consumer = Consumer
