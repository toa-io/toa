/**
 * Every component a Context has, with the version it runs: its own, the ones its extensions
 * bring, and the ones it evicts. A map is not rendered into a workload the way variables are, and
 * an evicted component is called like any other, so it is looked up like any other.
 *
 * @param {toa.norm.Context} context
 * @returns {Record<string, string>}
 */
export const map = (context) => {
  const versions = new Map()

  for (const component of context.components ?? [])
    versions.set(component.locator.id, component.version)

  // what an extension brings reaches a context as an instance of what it depends on
  for (const instances of Object.values(context.dependencies ?? {}))
    for (const { component } of instances)
      versions.set(component.locator.id, component.version)

  return Object.fromEntries([...versions].sort(([one], [other]) => one.localeCompare(other)))
}
