'use strict'

const { join } = require('node:path')
const { writeFile: write } = require('node:fs/promises')

const { yaml } = require('@toa.io/gears')
const { directory } = require('../util/directory')
const { copy } = require('../util/copy')

class Chart {
  name

  #context
  #compositions
  #dependencies

  #process
  #path

  constructor (context, compositions, process) {
    this.name = context.name

    this.#context = context
    this.#compositions = compositions
    this.#dependencies = Chart.dependencies(context)

    this.#process = process
  }

  async export (root) {
    const path = join(root, 'chart')
    const chart = yaml.dump(this.#declaration())
    const values = yaml.dump(this.#values())

    await directory(path)
    await copy(join(__dirname, 'assets/chart/templates'), join(path, 'templates'))

    await Promise.all([
      write(join(path, 'Chart.yaml'), chart),
      write(join(path, 'values.yaml'), values)
    ])

    this.#path = path
  }

  async update () {
    if (this.#path === undefined) throw new Error('Chart hasn\'t been exported')

    await this.#process.execute('helm', ['dependency', 'update', this.#path])
  }

  async upgrade (options = {}) {
    if (this.#path === undefined) throw new Error('Chart hasn\'t been exported')

    const { dry, wait } = options
    const args = []

    if (wait === true) args.push('--wait')
    if (dry === true) args.push('--dry-run')

    await this.#process.execute('helm', ['upgrade', this.name, '-i', ...args, this.#path])
  }

  #declaration () {
    const { name, description, version } = this.#context
    const dependencies = this.#dependencies.map((dependency) => dependency.declaration)

    return {
      apiVersion: 'v2',
      type: 'application',
      name,
      description,
      version,
      appVersion: version,
      dependencies
    }
  }

  #values () {
    const result = {}

    result.compositions = this.#deployments
    result.components = this.#context.components.map((component) => component.locator.label)

    for (const { declaration, values } of this.#dependencies) {
      result[declaration.alias || declaration.name] = values
    }

    return result
  }

  get #deployments () {
    return Array.from(this.#compositions).map((composition) => {
      const { name, components, replicas, image: { tag: image } } = composition

      return {
        name,
        components: components.map((component) => component.locator.label),
        replicas,
        image
      }
    })
  }

  static dependencies (context) {
    const map = (map) => {
      const list = []

      for (const [key, values] of Object.entries(map)) {
        const dependency = require(key)

        if (dependency.deployment !== undefined) {
          const { charts } = dependency.deployment(values)

          if (charts !== undefined) list.push(...charts)
        }
      }

      return list
    }

    const dependencies = []

    if (context.connectors !== undefined) dependencies.push(...map(context.connectors))
    if (context.extensions !== undefined) dependencies.push(...map(context.extensions))

    return dependencies
  }
}

exports.Chart = Chart
