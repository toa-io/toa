import { reply } from '../lib/state.ts'
import type { Reply } from '../lib/state.ts'

export async function transition (input: string, object: string, context: unknown): Promise<Reply> {
  return reply(input, object, context)
}
