import { newid } from '@toa.io/generic'
import * as norm from '@toa.io/norm'
import { deployment } from '@toa.io/operations'

import * as find from '../../util/find.js'

const { Factory } = deployment

export async function build (contextPath, componentPatterns) {
  const context = await createContext(contextPath, componentPatterns)
  const factory = new Factory(context)
  const registry = factory.registry()

  await registry.build()

  const composition = context.compositions[0].name
  const base = context.registry.base === undefined ? '' : context.registry.base + '/'

  return `${base}${context.name}/composition-${composition}`
}

async function createContext (contextPath, componentPatterns) {
  const contextRoot = find.context(contextPath)
  const context = await norm.context(contextRoot, 'docker')
  const paths = componentPatterns.map((pattern) => find.components(pattern))
  const components = await loadComponents(paths)
  const rnd = newid().substring(0, 6)
  const name = 'temp-' + rnd

  context.name += '-' + rnd
  context.compositions = [{
    name,
    components
  }]

  return context
}

/**
 * @param {string[]} paths
 * @return {Promise<toa.norm.Component[]>}
 */
async function loadComponents (paths) {
  const components = []

  for (const path of paths) {
    const component = await norm.component(path)

    components.push(component)
  }

  return components
}
