import * as load from '../load.js'

export const events = async (root) => {
  const modules = await load.events(root)
  return Object.fromEntries(modules.map(([name, module]) => [name, definition(module)]))
}

const definition = (module) => ({
  conditioned: module.condition !== undefined,
  subjective: module.payload !== undefined
})
