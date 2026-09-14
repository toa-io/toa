import { match } from 'node:assert/strict'
import { describe, it } from 'node:test'

import { module } from '../src/types/context.js'

describe('atom', () => {
  it('should write it on the Context every component shares', () => {
    const emitted = module({ name: 'dummies' }, [])

    match(
      emitted,
      /env: string\n  name: string\n  instance: string\n  atom: Atom\n  local: Local\n  remote: Remote/
    )
    match(
      emitted,
      /lock: <T>\(keys: string \| string\[\], routine: \(signal: AbortSignal & \{ error: Error \}, context: unknown\) => Promise<T>\) => Promise<T>/
    )
  })
})
