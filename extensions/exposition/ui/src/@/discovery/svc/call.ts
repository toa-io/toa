import * as origin from './net'
import type { Answer } from './net'

/**
 * Make one of the calls the tree describes. Nothing is remembered: what a call answers is
 * the caller's to read, and reading it again is making it again.
 */
export async function call(verb: string, path: string, body?: unknown): Promise<Answer> {
  return await origin.call(verb, path, body)
}

export type { Answer }
