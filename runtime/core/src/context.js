'use strict'

const { Connector } = require('./connector')

class Context extends Connector {
  #remotes

  constructor (remotes) {
    super()

    this.#remotes = remotes

    if (remotes !== undefined) this.depends(remotes)
  }

  get remotes () {
    return this.#remotes
  }
}

exports.Context = Context
