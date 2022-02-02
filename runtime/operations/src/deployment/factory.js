'use strict'

const { Composition } = require('./composition')
const { Compositions } = require('./compositions')
const { Image } = require('./image')
const { Deployment } = require('./deployment')
const { Chart } = require('./chart')
const { Process } = require('../process')
const { Console } = require('../console')

class Factory {
  #context
  #process
  #console

  constructor (context, options = {}) {
    this.#context = context
    this.#process = new Process(options.log)
    this.#console = new Console(options.log === false)
  }

  deployment () {
    const compositions = this.#compositions()
    const images = Array.from(compositions).map((composition) => composition.image)
    const chart = new Chart(this.#context, compositions, this.#process)

    return new Deployment(chart, images, this.#console)
  }

  #compositions () {
    return new Compositions(this.#context, (composition) => this.#composition(composition))
  }

  #composition (composition) {
    const image = this.#image(composition)

    return new Composition(composition, image)
  }

  #image = (composition) => new Image(composition, this.#context, this.#process)
}

exports.Factory = Factory
