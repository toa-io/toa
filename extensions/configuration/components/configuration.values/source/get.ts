import { resolve, type Context } from './lib/resolve'

export async function computation (input: Input, context: Context): Promise<object | null> {
  return await resolve(context, input.component, input.epoch)
}

interface Input {
  component: string
  epoch?: string
}
