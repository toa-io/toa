import { random, timeout } from '@toa.io/generic'
import { Connector } from '../src/connector.js'

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

/** Stands for a connector waiting for something that never arrives. */
class StuckConnector extends Connector {
  async open () {
    return new Promise(() => undefined)
  }
}

export { TestConnector, FailingConnector, StuckConnector }
