import { events, operations, receivers } from './.normalize/index.js'

const normalize = async (component) => {
  operations(component)
  await events(component)
  receivers(component)
}

export { normalize }
