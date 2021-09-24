'use strict'

const { Connector } = require('./connector')

class Absorption extends Connector {
  #bridges

  labels

  constructor (bridges) {
    super()

    this.#bridges = bridges
    this.labels = Object.keys(bridges)

    this.depends(bridges)
  }
}

exports.Absorption = Absorption
