'use strict'

const { join } = require('node:path')
const { writeFile: write } = require('node:fs/promises')
const { yaml, directory: { copy } } = require('@toa.io/gears')

/**
 * @implements {toa.operations.deployment.Deployment}
 */
class Deployment {
  /** @type {toa.operations.deployment.Declaration} */
  #declaration
  /** @type {toa.operations.deployment.Contents} */
  #contents
  /** @type {toa.operations.Process} */
  #process
  /** @type {string} */
  #target

  /**
   * @param context {toa.formation.Context}
   * @param compositions {Array<toa.operations.deployment.Composition>}
   * @param dependencies {Array<toa.operations.deployment.Dependency>}
   * @param process {toa.operations.Process}
   */
  constructor (context, compositions, dependencies, process) {
    const dependency = Deployment.#merge(dependencies)

    this.#declaration = Deployment.#declare(context, dependency)
    this.#contents = Deployment.#describe(compositions, dependency)
    this.#process = process
  }

  async export (target) {
    const chart = yaml.dump(this.#declaration)
    const values = yaml.dump(this.#contents)

    await Promise.all([
      write(join(target, 'Chart.yaml'), chart),
      write(join(target, 'values.yaml'), values),
      copy(TEMPLATES, join(target, 'templates'))
    ])

    this.#target = target
  }

  async install (options) {
    if (this.#target === undefined) throw new Error('Deployment hasn\'t been exported')

    const args = []

    if (options.wait === true) args.push('--wait')

    await this.#process.execute('helm', ['dependency', 'update', this.#target])
    await this.#process.execute('helm', ['upgrade', this.#declaration.name, '-i', ...args, this.#target])
  }

  async template () {
    if (this.#target === undefined) throw new Error('Deployment hasn\'t been exported')

    await this.#process.execute('helm', ['dependency', 'update', this.#target], { silently: true })

    return await this.#process.execute('helm',
      ['template', this.#declaration.name, this.#target],
      { silently: true })
  }

  /**
   * @param dependencies {Array<toa.operations.deployment.Dependency>}
   * @returns {toa.operations.deployment.Dependency}
   */
  static #merge (dependencies) {
    /** @type {Array<toa.operations.deployment.Reference>} */
    const references = []
    /** @type {Array<toa.operations.deployment.Service>} */
    const services = []

    for (const dependency of dependencies) {
      if (dependency.references !== undefined) references.push(...dependency.references)
      if (dependency.services !== undefined) services.push(...dependency.services)
    }

    return { references, services }
  }

  /**
   * @param context {toa.formation.Context}
   * @param dependency {toa.operations.deployment.Dependency}
   * @returns {toa.operations.deployment.Declaration}
   */
  static #declare (context, { references }) {
    const { name, description, version } = context

    const dependencies = references.map(({ values, ...rest }) => rest)

    return {
      ...DECLARATION,
      name,
      description,
      version,
      appVersion: version,
      dependencies
    }
  }

  /**
   * @param compositions {Array<toa.operations.deployment.Composition>}
   * @param dependency {toa.operations.deployment.Dependency}
   * @returns {toa.operations.deployment.Contents}
   */
  static #describe (compositions, { references, services }) {
    /** @type {Set<string>} */
    const components = new Set()

    for (const composition of compositions) {
      for (const component of composition.components) {
        components.add(component)
      }
    }

    const dependencies = references?.reduce((map, reference) => {
      const { name, alias, values } = reference

      map[alias || name] = values

      return map
    }, {})

    return {
      compositions,
      components: Array.from(components),
      services,
      ...dependencies
    }
  }
}

const DECLARATION = {
  apiVersion: 'v2',
  type: 'application'
}

const TEMPLATES = join(__dirname, 'chart/templates')

exports.Deployment = Deployment
