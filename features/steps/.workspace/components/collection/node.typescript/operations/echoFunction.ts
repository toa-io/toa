import { shout } from '../lib/shout.ts'

interface Context {
  configuration: { foo: string }
}

export async function computation (input: string, context: Context): Promise<string> {
  return shout(input, context.configuration.foo)
}
