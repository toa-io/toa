import { Connector, instance } from '@toa.io/core'

export class Consumer extends Connector {
  #bindings
  #locator
  #endpoint

  constructor(bindings, locator, endpoint) {
    super()

    this.#bindings = bindings
    this.#locator = locator
    this.#endpoint = endpoint
  }

  /**
   * An addressed call is served here when it names this process, and handed to the next binding
   * when it names another: the call is for that process, whichever replica composes the component here.
   */
  async request(request, terms) {
    if (terms?.instance !== undefined && terms.instance !== instance()) return false

    const invoke = this.#bindings[this.#locator.id]?.[this.#endpoint]

    if (invoke === undefined) return false
    else return invoke(request)
  }
}
