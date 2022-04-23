'use strict'

class Services {
  #services

  constructor (context, instantiate) {
    const declarations = Services.#resolve(context)
  }

  [Symbol.iterator] = () => this.#services.values()

  static #resolve (context) {
    // ?
  }
}

exports.Services = Services
