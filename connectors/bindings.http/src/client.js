'use strict'

class Client {
  async post (path) {

  }

  async options (path) {
    return this.#request('OPTIONS', path)
  }

  async #request (verb, path) {

  }
}

exports.Client = Client
