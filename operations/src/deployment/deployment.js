import { join } from 'node:path'
import { writeFile as write } from 'node:fs/promises'
import { yaml as jsyaml } from '@toa.io/generic'
import { cp } from 'node:fs/promises'
import { shortcuts } from '@toa.io/norm'

import { merge, declare, describe } from './.deployment/index.js'
import { drain } from './drain.js'

export class Deployment {
  #chart
  #values
  #keyed
  #process
  #target

  constructor(context, compositions, dependencies, process, image) {
    const dependency = merge(dependencies)

    this.#chart = declare(context, dependency)
    this.#values = describe(context, compositions, dependency, image)
    this.#keyed = dependency.variables
    this.#process = process
  }

  async export(target) {
    const chart = dump(this.#chart)
    const values = dump(this.#values)

    await Promise.all([
      write(join(target, 'Chart.yaml'), chart),
      write(join(target, 'values.yaml'), values),
      cp(TEMPLATES, join(target, 'templates'), { recursive: true })
    ])

    this.#target = target
  }

  async install(options) {
    if (options.target) this.#target = options.target
    if (this.#target === undefined) throw new Error("Deployment hasn't been exported")

    const args = []

    if (options.namespace !== undefined) args.push('-n', options.namespace)
    if (options.wait === true) args.push('--wait')
    if (options.timeout !== undefined) args.push('--timeout', options.timeout)

    await this.#update()
    await this.#process.execute('helm', [
      'upgrade',
      this.#chart.name,
      '-i',
      ...args,
      this.#target
    ])

    // ready is not done: the replicas replaced are still draining when helm answers
    if (options.wait === true) await drain(this.#process, options)
  }

  async template(options) {
    if (this.#target === undefined) throw new Error("Deployment hasn't been exported")

    await this.#update({ silently: true })

    const args = []

    if (options.namespace !== undefined) args.push('-n', options.namespace)

    return await this.#process.execute(
      'helm',
      ['template', this.#chart.name, ...args, this.#target],
      { silently: true }
    )
  }

  /**
   * A chart with no subcharts has nothing to resolve, and the call still reaches out for
   * the repositories it would have read.
   *
   * @param {object} [options]
   * @returns {Promise<void>}
   */
  async #update(options = {}) {
    if (this.#chart.dependencies.length === 0) return

    await this.#process.execute('helm', ['dependency', 'update', this.#target], options)
  }

  /**
   * @param {{ components?: string[], services?: string[] }} [options]
   * @returns {toa.deployment.dependency.Variable[]}
   */
  variables(options = {}) {
    if (options.components === undefined && options.services === undefined) {
      const variables = []
      const used = new Set()

      addVariables(this.#values.compositions, variables, used)
      addVariables(this.#values.services, variables, used)

      if (this.#values.mono !== undefined)
        addVariables([this.#values.mono], variables, used)

      return variables
    }

    return this.#select(options.components, options.services)
  }

  /**
   * @param {string[] | undefined} components
   * @param {string[] | undefined} services
   * @returns {toa.deployment.dependency.Variable[]}
   */
  #select(components, services) {
    const labels = labelsOf(this.#values, this.#keyed)
    const keys = new Set(['global'])
    const selected = []

    for (const token of components ?? []) keys.add(matchComponent(token, labels))

    for (const token of services ?? []) {
      const service = matchService(token, this.#values.services)

      selected.push(service)

      for (const label of service.components ?? []) keys.add(label)
    }

    const variables = []
    const used = new Set()

    for (const key of keys) append(this.#keyed[key], variables, used)

    for (const service of selected) append(service.variables, variables, used)

    return variables
  }
}

function addVariables(list, variables, used = new Set()) {
  if (list === undefined) return

  for (const item of list) append(item.variables, variables, used)
}

function append(set, variables, used) {
  if (set === undefined) return

  for (const variable of set) {
    if (used.has(variable.name)) continue

    variables.push(variable)
    used.add(variable.name)
  }
}

function labelsOf(values, keyed) {
  const labels = new Set(values.components ?? [])

  for (const service of values.services ?? [])
    for (const label of service.components ?? []) labels.add(label)

  for (const key of Object.keys(keyed ?? {})) if (key !== 'global') labels.add(key)

  return labels
}

function matchComponent(token, labels) {
  const candidates = [token, token.replaceAll('.', '-').toLowerCase()]

  if (!token.includes('.')) candidates.push('default-' + token.toLowerCase())

  for (const candidate of candidates) if (labels.has(candidate)) return candidate

  throw new Error(`Component '${token}' is not in the context`)
}

function matchService(token, services) {
  const resolved = shortcuts.resolve(token)

  const service = (services ?? []).find((service) => {
    if (service.name === token || service.group === token) return true

    for (const [alias, pkg] of Object.entries(shortcuts.SHORTCUTS))
      if (resolved === pkg && service.group === alias) return true

    return false
  })

  if (service === undefined) throw new Error(`Service '${token}' is not in the context`)

  return service
}

const TEMPLATES = join(import.meta.dirname, 'chart/templates')

function dump(object) {
  // js-yaml writes plain objects only, and the values carry locators and images
  return jsyaml.dump(JSON.parse(JSON.stringify(object)), { noRefs: true, lineWidth: -1 })
}
