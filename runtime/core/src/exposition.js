'use strict'

const { Connector } = require('./connector')

class Exposition extends Connector {
  locator
  endpoints = ['lookup']

  constructor (locator) {
    super()

    this.locator = locator
  }

  lookup () {
    return this.locator.export()
  }

  async invoke (name, input) {
    return { output: this[name](input) }
  }
}

exports.Exposition = Exposition
