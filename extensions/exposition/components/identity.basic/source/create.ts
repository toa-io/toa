import { type Reply } from '@toa.io/types'
import { type Context } from './types'

export async function effect
(input: CreateInput, context: Context): Promise<Reply<CreateOutput>> {
  const [username, password] = atob(input.credentials).split(':')
  const request = { input: { username, password }, query: { id: input.id } }
  const reply = await context.local.transit(request)

  if (reply.output === undefined)
    return { error: reply.error }

  return { output: { id: reply.output.id } }
}

interface CreateInput {
  id: string
  credentials: string
}

interface CreateOutput {
  id: string
}
