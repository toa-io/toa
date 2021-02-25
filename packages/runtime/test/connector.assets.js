const { Connector } = require('../src/connector')

class TestConnector extends Connector {
  #label
  #seq

  constructor (label, seq) {
    super()

    this.#seq = seq
    this.#label = label
  }

  async connection () {
    await timeout(Math.random() * 30)
    this.#seq.push(`+${this.#label}`)
  }

  async disconnection () {
    await timeout(Math.random() * 30)
    this.#seq.push(`-${this.#label}`)
  }
}

function timeout (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

exports.TestConnector = TestConnector
