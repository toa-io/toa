import { contract } from '@toa.io/core'

/**
 * Every component a Context has, with the version it runs and the contract of that version: its
 * own, the ones its extensions bring, and the ones it evicts. A map is not rendered into a
 * workload the way variables are, and an evicted component is called like any other, so it is
 * described like any other.
 *
 * @param {toa.norm.Context} context
 * @returns {Record<string, import('@toa.io/core').Contract>}
 */
export const map = (context) => {
  const components = new Map()

  for (const component of context.components ?? [])
    components.set(component.locator.id, contract.component(component))

  // what an extension brings reaches a context as an instance of what it depends on
  for (const instances of Object.values(context.dependencies ?? {}))
    for (const { component } of instances)
      components.set(component.locator.id, contract.component(component))

  return Object.fromEntries([...components].sort(([one], [other]) => one.localeCompare(other)))
}
