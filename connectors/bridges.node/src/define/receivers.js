import * as load from '../load.js'

export const receiver = async (root, label) => {
  const module = await load.receiver(root, label)

  return definition(module)
}

export const receivers = async (root) => {
  const modules = await load.receivers(root)

  return Object.fromEntries(modules.map(([name, module]) => [name, definition(module)]))
}

const definition = (module) => ({
  conditioned: module.condition !== undefined,
  adaptive: module.request !== undefined
})
