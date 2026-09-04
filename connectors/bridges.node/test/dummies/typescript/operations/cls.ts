import { reply } from '../lib/state.ts'
import type { Reply } from '../lib/state.ts'

export class Transition {
  #context: unknown

  async mount (context: unknown): Promise<void> {
    this.#context = context
  }

  async execute (input: string, object: string): Promise<Reply> {
    return reply(input, object, this.#context)
  }
}
