import { resolve, type Context } from './lib/resolve'

export async function computation (input: Input, context: Context): Promise<object | null> {
  const value = await resolve(context, input.component, input.epoch)

  return value === null ? null : value.configuration
}

interface Input {
  component: string
  epoch?: string
}
