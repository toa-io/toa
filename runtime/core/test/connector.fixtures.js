'use strict'

const { random, timeout } = require('@toa.io/generic')
const { Connector } = require('../src/connector')

class TestConnector extends Connector {
  #label
  #seq

  constructor (label, seq) {
    super()

    this.#seq = seq
    this.#label = label
  }

  async open () {
    await timeout(random(10))
    this.#seq.push(`+${this.#label}`)
  }

  async close () {
    await timeout(random(10))
    this.#seq.push(`-${this.#label}`)
  }

  async dispose () {
    this.#seq.push(`*${this.#label}`)
  }
}

class FailingConnector extends Connector {
  async open () {
    await timeout(random(10))
    throw new Error('FailingConnector')
  }
}

exports.TestConnector = TestConnector
exports.FailingConnector = FailingConnector
