'use strict'

const fs = require('node:fs/promises')
const execa = require('execa')
const { join } = require('node:path')
const { yaml } = require('@toa.io/gears')

const { directory } = require('./deployment/directory')
const { chart } = require('./deployment/chart')
const { values } = require('./deployment/values')
const { dependencies } = require('./deployment/dependencies')

class Deployment {
  #context
  #chart
  #values

  constructor (context) {
    const deps = dependencies(context)

    this.#context = context
    this.#chart = chart(context, deps)
    this.#values = values(context, deps)
  }

  async export (path) {
    path = await directory(path)

    await this.#dump(path)

    return path
  }

  async install (wait) {
    const path = await this.export()
    const args = []

    if (wait === true) args.push('--wait')

    await execa('helm', ['dependency', 'update', path])
    await execa('helm', ['upgrade', this.#context.name, '-i', ...args, path])
    await fs.rm(path, { recursive: true })
  }

  async #dump (path) {
    const chart = yaml.dump(this.#chart)
    const values = yaml.dump(this.#values)

    await Promise.all([
      fs.writeFile(join(path, 'Chart.yaml'), chart),
      fs.writeFile(join(path, 'values.yaml'), values)
    ])
  }
}

exports.Deployment = Deployment
