import { components, entry } from './lib/map.js'
import { resolve, type Context } from './lib/resolve.js'

/** The configuration of every component for its deployed epoch, by component name. */
export async function computation (_: null, context: Context): Promise<Item[]> {
  return await Promise.all(components().map(async (component) => {
    const { epoch, schema } = entry(component)!
    const value = await resolve(context, component, epoch)

    return { component, epoch, schema, configuration: value!.configuration }
  }))
}

interface Item {
  component: string
  epoch: string
  schema: object
  configuration: object
}
