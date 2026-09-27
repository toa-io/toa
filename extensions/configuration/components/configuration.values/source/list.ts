import { components, configured } from './lib/map.ts'
import { resolve, type Context } from './lib/resolve.ts'

/** The configuration of every component for its deployed epoch, by component name. */
export async function computation(_: null, context: Context): Promise<Item[]> {
  return await Promise.all(
    components().map(async (component) => {
      const { epoch, schema } = configured(component)!
      const value = await resolve(context, component, epoch)

      return {
        component,
        epoch,
        schema,
        configuration: value!.configuration,
        created: value!.created,
        revision: value!.revision
      }
    })
  )
}

interface Item {
  component: string
  epoch: string
  schema: object
  configuration: object
  created: number
  revision: string | null
}
