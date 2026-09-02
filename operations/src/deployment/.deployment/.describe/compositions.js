import { addVariables } from './variables.js'
import { addMounts } from './mounts.js'

function compositions (compositions, dependency) {
  for (const composition of compositions) {
    addVariables(composition, dependency.variables)
    addMounts(composition, dependency.mounts)

    if (dependency.probe !== undefined && dependency.probe !== false)
      composition.probe ??= dependency.probe
  }
}

export { compositions }
