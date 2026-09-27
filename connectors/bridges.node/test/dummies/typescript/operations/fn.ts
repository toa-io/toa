import { reply } from '../lib/state.ts'
import type { Reply } from '../lib/state.ts'

export async function transition(
  input: string,
  entry: string,
  context: unknown
): Promise<Reply> {
  return reply(input, entry, context)
}
