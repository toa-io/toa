'use strict'

const { join } = require('node:path')
const { writeFile: write } = require('node:fs/promises')
const { yaml } = require('@toa.io/gears')

const { copy } = require('../util/copy')

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
   * @param context {toa.formation.context.Context}
   * @param compositions {Array<toa.operations.deployment.Composition>}
   * @param dependencies {Array<toa.operations.deployment.Dependency>}
   * @param process {toa.operations.Process}
   */
  constructor (context, compositions, dependencies, process) {
    const { references } = Deployment.#sort(dependencies)

    this.#declaration = Deployment.#declare(context, references)
    this.#contents = Deployment.#describe(compositions, references)
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
    if (options.dry === true) args.push('--dry-run')

    await this.#process.execute('helm', ['dependency', 'update', this.#target])
    await this.#process.execute('helm', ['upgrade', this.#declaration.name, '-i', ...args, this.#target])
  }

  /**
   * @param dependencies {Array<toa.operations.deployment.Dependency>}
   * @returns {{ references: Array<toa.operations.deployment.Reference> }}
   */
  static #sort (dependencies) {
    /** @type {Array<toa.operations.deployment.Reference>} */
    const references = []

    for (const dependency of dependencies) {
      if (dependency.references === undefined) continue

      references.push(...dependency.references)
    }

    return { references }
  }

  /**
   * @param context {toa.formation.context.Context}
   * @param references {Array<toa.operations.deployment.Reference>}
   * @returns {toa.operations.deployment.Declaration}
   */
  static #declare (context, references) {
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
   * @param references {Array<toa.operations.deployment.Reference>}
   * @returns {toa.operations.deployment.Contents}
   */
  static #describe (compositions, references) {
    /** @type {Set<string>} */
    const components = new Set()

    for (const composition of compositions) {
      for (const component of composition.components) {
        components.add(component)
      }
    }

    const dependencies = references.reduce((map, reference) => {
      const { name, alias, values } = reference

      map[alias || name] = values

      return map
    }, {})

    return {
      compositions,
      components: Array.from(components),
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
