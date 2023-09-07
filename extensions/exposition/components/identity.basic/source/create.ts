import { type Nopeable } from 'nopeable'
import { type Context } from './types'

export async function effect
(input: CreateInput, context: Context): Promise<Nopeable<CreateOutput>> {
  const [username, password] = atob(input.credentials).split(':')
  const request = { input: { username, password }, query: { id: input.id } }

  return await context.local.transit(request)
}

interface CreateInput {
  id: string
  credentials: string
}

interface CreateOutput {
  id: string
}
