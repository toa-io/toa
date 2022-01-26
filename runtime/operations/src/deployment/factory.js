'use strict'

const { Composition } = require('./composition')
const { Compositions } = require('./compositions')
const { Image } = require('./image')
const { Deployment } = require('./deployment')
const { Chart } = require('./chart')

class Factory {
  #context

  constructor (context) {
    this.#context = context
  }

  deployment () {
    const compositions = this.#compositions()
    const images = Array.from(compositions).map((composition) => composition.image)
    const chart = new Chart(this.#context, compositions)

    return new Deployment(chart, images)
  }

  #compositions () {
    return new Compositions(this.#context, (composition) => this.#composition(composition))
  }

  #composition (composition) {
    const image = this.#image(composition)

    return new Composition(composition, image)
  }

  #image = (composition) => new Image(composition, this.#context)
}

exports.Factory = Factory
