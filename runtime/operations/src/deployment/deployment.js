'use strict'

const { directory } = require('../util/directory')

class Deployment {
  #chart
  #images
  #console

  constructor (chart, images, console) {
    this.#chart = chart
    this.#images = images
    this.#console = console
  }

  async export (path) {
    path = await this.#export(path)

    return path
  }

  async install (options = {}) {
    const { dry, wait } = options

    const path = await this.#console.task('Compose deployment', () => this.#export())

    await this.#console.sequence('Build images', this.#images.map((image) => async () => {
      await image.build()
      await image.push()
    }))

    await this.#console.task('Download dependencies', () => this.#chart.update())
    await this.#console.task('Install deployment', () => this.#chart.upgrade({ dry, wait }))
    await this.#console.task('Cleanup', () => directory.clear(path))
  }

  async #export (path) {
    if (path === undefined) path = await directory.temp('deployment')
    else path = await directory(path)

    await this.#chart.export(path)

    for (const image of this.#images) await image.export(path)

    return path
  }
}

exports.Deployment = Deployment
