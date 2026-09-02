import { resolve, type Context } from './lib/resolve.js'

export async function computation (input: Pair[], context: Context): Promise<Fetched[]> {
  return await Promise.all(input.map(async ({ component, epoch }) => {
    const value = await resolve(context, component, epoch)

    return {
      component,
      epoch,
      configuration: value === null ? null : value.configuration,
      created: value === null ? 0 : value.created
    }
  }))
}

interface Pair {
  component: string
  epoch: string
}

interface Fetched extends Pair {
  configuration: object | null
  created: number
}
