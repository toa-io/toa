'use strict'

class Consumer {
  #client

  constructor (client) {
    this.#client = client
  }

  request () {

  }

  react () {

  }

  discover () {
    this.#client.options()
  }
}

exports.Consumer = Consumer
