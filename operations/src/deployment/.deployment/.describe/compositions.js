import { addVariables } from './variables.js'
import { addMounts } from './mounts.js'
import { fold } from './fold.js'

export function compositions (compositions, dependency) {
  for (const composition of compositions) {
    const claimed = (dependency.services ?? [])
      .filter((service) => service.workload?.includes(composition.name) === true)

    // a service brings components of its own — the identity components inside the gateway —
    // and their variables are keyed by their own labels, not by the composition's
    const keys = composition.components
      .concat(...claimed.map((service) => service.components ?? []))

    addVariables(composition, dependency.variables, keys)
    addMounts(composition, dependency.mounts, keys)

    if (claimed.length > 0) {
      // the label each hosted service's own Service selects on
      composition.hosted = claimed.map((service) => service.name)

      fold(composition, claimed, dependency)
    }

    if (dependency.probe !== undefined && dependency.probe !== false)
      composition.probe ??= dependency.probe
  }
}
