import { type Context } from './types'

export async function effect (input: Input, context: Context): Promise<Output> {
  const [username, password] = Buffer.from(input.credentials, 'base64').toString().split(':')

  const request = {
    input: { authority: input.authority, username, password },
    query: { id: input.id }
  }

  return await context.local.transit(request)
}

interface Input {
  authority: string
  id: string
  credentials: string
}

interface Output {
  id: string
}
