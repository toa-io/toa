import { merge } from '@toa.io/generic'

export const dereference = (manifest) => {
  if (!('operations' in manifest)) return

  for (const operation of Object.values(manifest.operations)) {
    if (operation.forward !== undefined) forward(operation, manifest.operations)
  }

  for (const operation of Object.values(manifest.operations)) {
    delete operation.forwarded
  }
}

const forward = (operation, operations) => {
  const target = operations[operation.forward]

  if (target === undefined)
    throw new Error(`Referenced operation '${operation.forward}' is not defined`)

  if (target.forward !== undefined) {
    if (target.forwarded !== true) forward(target, operations)

    operation.forward = target.forward
  }

  operation.forwarded = true

  const { virtual, ...real } = target

  merge(operation, real)
}
