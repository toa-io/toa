import { resolve, type Context } from './lib/resolve'

export async function computation (input: Pair[], context: Context): Promise<Fetched[]> {
  return await Promise.all(input.map(async ({ component, epoch }) => ({
    component,
    epoch,
    configuration: await resolve(context, component, epoch)
  })))
}

interface Pair {
  component: string
  epoch: string
}

interface Fetched extends Pair {
  configuration: object | null
}
