import * as origin from './net'
import type { Answer, Call } from './net'

/**
 * Make one of the calls the tree describes. Nothing is remembered: what a call answers is
 * the caller's to read, and reading it again is making it again.
 */
export async function call(of: Call): Promise<Answer> {
  return await origin.call(of)
}

export type { Answer, Call }
