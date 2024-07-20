'use strict'

const { join } = require('node:path')
const { writeFile: write } = require('node:fs/promises')
const { dump } = require('@toa.io/yaml')
const fs = require('fs-extra')

const { merge, declare, describe } = require('./.deployment')

class Deployment {
  #chart
  #values
  #process
  #target

  constructor (context, compositions, dependencies, process) {
    const dependency = merge(dependencies)

    this.#chart = declare(context, dependency)
    this.#values = describe(context, compositions, dependency)
    this.#process = process
  }

  async export (target) {
    const chart = dump(this.#chart)
    const values = dump(this.#values)

    await Promise.all([
      write(join(target, 'Chart.yaml'), chart),
      write(join(target, 'values.yaml'), values),
      fs.copy(TEMPLATES, join(target, 'templates'))
    ])

    this.#target = target
  }

  async install (options) {
    if (options.target) this.#target = options.target
    if (this.#target === undefined) throw new Error('Deployment hasn\'t been exported')

    const args = []

    if (options.namespace !== undefined) args.push('-n', options.namespace)
    if (options.wait === true) args.push('--wait')
    if (options.timeout !== undefined) args.push('--timeout', options.timeout)

    await this.#process.execute('helm', ['dependency', 'update', this.#target])
    await this.#process.execute('helm', ['upgrade', this.#chart.name, '-i', ...args, this.#target])
  }

  async template (options) {
    if (this.#target === undefined) throw new Error('Deployment hasn\'t been exported')

    await this.#process.execute('helm', ['dependency', 'update', this.#target], { silently: true })

    const args = []

    if (options.namespace !== undefined) args.push('-n', options.namespace)

    return await this.#process.execute('helm',
      ['template', this.#chart.name, ...args, this.#target],
      { silently: true })
  }

  variables () {
    const variables = []
    const used = new Set()

    addVariables(this.#values.compositions, variables, used)
    addVariables(this.#values.services, variables, used)

    return variables
  }
}

function addVariables (list, variables, used = new Set()) {
  for (const item of list) {
    if (item.variables === undefined) continue

    for (const variable of item.variables) {
      if (used.has(variable.name)) continue

      variables.push(variable)
      used.add(variable.name)
    }
  }
}

const TEMPLATES = join(__dirname, 'chart/templates')

exports.Deployment = Deployment
