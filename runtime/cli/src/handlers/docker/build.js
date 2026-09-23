import { realpath } from 'node:fs/promises'

import { newid } from '@toa.io/generic'
import * as norm from '@toa.io/norm'
import { deployment } from '@toa.io/operations'

import * as find from '../../util/find.js'

const { Factory } = deployment

/**
 * @param {string} contextPath
 * @param {string[]} componentPatterns
 * @param {string[]} [services] what the composition runs beside its components
 * @return {Promise<string>} the reference of the image built
 */
export async function build(contextPath, componentPatterns, services = []) {
  const context = await createContext(contextPath, componentPatterns, services)
  const factory = new Factory(context)
  const registry = factory.registry()

  await registry.build()

  // the composition's own image, rather than the dependencies it is laid over
  return registry.tags()[0]
}

async function createContext(contextPath, componentPatterns, services) {
  const contextRoot = find.context(contextPath)
  const context = await norm.context(contextRoot, 'docker')
  const paths = componentPatterns.map((pattern) => find.components(pattern))
  const components = await select(context, paths)
  const rnd = newid().substring(0, 6)
  const name = 'temp-' + rnd

  context.name += '-' + rnd
  context.compositions = [
    {
      name,
      components,
      packages: await install(context, services)
    }
  ]

  return context
}

/**
 * The context's own components, rather than the same manifests read again: what the extensions
 * install for a component's declarations is what the context resolved for it.
 *
 * @param {toa.norm.Context} context
 * @param {string[]} paths
 * @return {Promise<toa.norm.Component[]>}
 */
async function select(context, paths) {
  const known = new Map()

  for (const component of context.components)
    known.set(await realpath(component.path), component)

  const components = new Set()

  for (const path of paths) {
    const component = known.get(await realpath(path))

    if (component === undefined)
      throw new Error(`'${path}' is not a component of the context '${context.name}'.`)

    components.add(component)
  }

  return [...components]
}

/**
 * What a composition the context lists these services on is given (see `resolve` in
 * `@toa.io/norm`): what each installs where it is asked for no component's instance, read
 * with the context's annotation of it.
 *
 * @param {toa.norm.Context} context
 * @param {string[]} services
 * @return {Promise<Record<string, string> | undefined>}
 */
async function install(context, services) {
  let packages

  for (const reference of services) {
    const { name, module } = await norm.definition(norm.shortcuts.resolve(reference))

    if (module.installs !== undefined)
      Object.assign(
        (packages ??= {}),
        module.installs(undefined, context.annotations?.[name])
      )
  }

  return packages
}
