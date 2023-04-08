'use strict'

const { join } = require('node:path')
const { writeFile: write } = require('node:fs/promises')
const { directory: { copy } } = require('@toa.io/filesystem')
const { dump } = require('@toa.io/yaml')

const { merge, declare, describe } = require('./.deployment')

/**
 * @implements {toa.deployment.Deployment}
 */
class Deployment {
  /** @type {toa.deployment.Declaration} */
  #declaration
  /** @type {toa.deployment.Contents} */
  #contents
  /** @type {toa.operations.Process} */
  #process
  /** @type {string} */
  #target

  /**
   * @param context {toa.norm.Context}
   * @param compositions {toa.deployment.Composition[]}
   * @param dependencies {toa.deployment.Dependency[]}
   * @param process {toa.operations.Process}
   */
  constructor (context, compositions, dependencies, process) {
    const dependency = merge(dependencies)

    if (context.environment === 'local') throw new Error('Deployment environment name \'local\' is not allowed.')

    this.#declaration = declare(context, dependency)
    this.#contents = describe(context, compositions, dependency)
    this.#process = process
  }

  async export (target) {
    const chart = dump(this.#declaration)
    const values = dump(this.#contents)

    await Promise.all([
      write(join(target, 'Chart.yaml'), chart),
      write(join(target, 'values.yaml'), values),
      copy(TEMPLATES, join(target, 'templates'))
    ])

    this.#target = target
  }

  async install (options) {
    if (options.target) this.#target = options.target
    if (this.#target === undefined) throw new Error('Deployment hasn\'t been exported')

    const args = []

    if (options.namespace !== undefined) args.push('-n', options.namespace)
    if (options.wait === true) args.push('--wait')

    await this.#process.execute('helm', ['dependency', 'update', this.#target])
    await this.#process.execute('helm', ['upgrade', this.#declaration.name, '-i', ...args, this.#target])
  }

  async template (options) {
    if (this.#target === undefined) throw new Error('Deployment hasn\'t been exported')

    await this.#process.execute('helm', ['dependency', 'update', this.#target], { silently: true })

    const args = []

    if (options.namespace !== undefined) args.push('-n', options.namespace)

    return await this.#process.execute('helm',
      ['template', this.#declaration.name, ...args, this.#target],
      { silently: true })
  }

  variables () {
    return this.#contents.variables
  }
}

const TEMPLATES = join(__dirname, 'chart/templates')

exports.Deployment = Deployment
