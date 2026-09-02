import { entry } from './lib/map'
import { resolve, type Context } from './lib/resolve'

/**
 * The latest configuration of a component, with the schema it is checked against. The
 * schema is the deployment's, so an epoch the deployment does not know has none — the
 * value is still what was stored for it.
 */
export async function computation (input: Input, context: Context): Promise<Item | null> {
  const value = await resolve(context, input.component, input.epoch)

  if (value === null)
    return null

  const known = entry(input.component)

  return {
    configuration: value.configuration,
    schema: known?.schema,
    epoch: input.epoch ?? known!.epoch
  }
}

interface Input {
  component: string
  epoch?: string
}

interface Item {
  configuration: object
  schema?: object
  epoch: string
}
