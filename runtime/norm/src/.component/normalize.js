import { events, operations, receivers } from './.normalize/index.js'

export const normalize = async (component) => {
  operations(component)
  await events(component)
  receivers(component)
}
