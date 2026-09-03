import { Producer } from './producer.js'
import { Consumer } from './consumer.js'

export class Factory {
  #bindings = {}

  producer (locator, endpoints, producer) {
    return new Producer(this.#bindings, locator, endpoints, producer)
  }

  consumer (locator, endpoint) {
    return new Consumer(this.#bindings, locator, endpoint)
  }
}
