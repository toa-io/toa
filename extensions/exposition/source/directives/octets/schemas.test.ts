import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import * as schemas from './schemas.js'

describe('workflow', () => {
  const ok = [
    { echo: 'hello world' },
    [{ echo: 'hello world' }, { ok: 'ok' }]
  ]

  const oh = [
    { echo: [] },
    { echo: 'hello world', ok: { not: 'ok' } }
  ]

  for (const workflow of ok)
     it('should be valid', () => {
    assert.doesNotThrow(() => schemas.workflow.validate(workflow))
  })

  for (const workflow of oh)
     it('should not be valid', () => {
    assert.throws(() => schemas.workflow.validate(workflow))
  })
})
