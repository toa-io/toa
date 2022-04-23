'use strict'

const { Composition } = require('./composition')
const { Compositions } = require('./compositions')
const { Services } = require('./services')
const { Deployment } = require('./deployment')
const { Chart } = require('./chart')
const { Process } = require('../process')
const { Console } = require('../console')
const images = require('./images')

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
    const image = new images.Composition(this.#context, this.#process, composition)

    return new Composition(composition, image)
  }

  #services () {
    return new Services(this.#context, (service) => this.#service(service))
  }

  #service (service) {
    const image = new images.Service(this.#context, this.#process, service)

    return new Service()
  }
}

exports.Factory = Factory
