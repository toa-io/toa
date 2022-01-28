'use strict'

const { writeFile: write, rm: remove } = require('node:fs/promises')
const execa = require('execa')
const { join } = require('node:path')
const { yaml } = require('@toa.io/gears')

const { directory } = require('./directory')
const { copy } = require('./copy')

class Deployment {
  #chart
  #images

  constructor (chart, images) {
    this.#chart = chart
    this.#images = images
  }

  async export (root) {
    if (root === undefined) root = await directory.temp('deployment')
    else root = await directory(root)

    await this.#dump(root)

    return root
  }

  async install (options = {}) {
    await this.#push()
    return await this.#upgrade(options)
  }

  async #dump (root) {
    const path = join(root, 'chart')
    const chart = yaml.dump(this.#chart.declaration)
    const values = yaml.dump(this.#chart.values)

    await directory(path)
    await copy(join(__dirname, 'assets/chart/templates'), join(path, 'templates'))

    await Promise.all([
      write(join(path, 'Chart.yaml'), chart),
      write(join(path, 'values.yaml'), values)
    ])

    await Promise.all(this.#images.map((image) => image.export(root)))
  }

  async #push () {
    for (const image of this.#images) {
      await image.build()
      await image.push()
    }
  }

  async #upgrade (options) {
    const path = await this.export()
    const args = []

    if (options.wait === true) args.push('--wait')
    if (options.dry === true) args.push('--dry-run')

    const update = execa('helm', ['dependency', 'update', path])

    update.stdout.pipe(process.stdout)
    await update

    const upgrade = execa('helm', ['upgrade', this.#chart.name, '-i', ...args, path])

    upgrade.stdout.pipe(process.stdout)
    const output = await upgrade

    await remove(path, { recursive: true })

    return output
  }
}

exports.Deployment = Deployment
