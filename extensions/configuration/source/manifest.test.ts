import { it } from 'node:test'
import assert from 'node:assert/strict'

import { type Manifest, manifest } from './manifest.js'

it('should validate', async () => {
  const additional = { schema: {}, foo: 'bar' } as unknown as Manifest

  assert.throws(() => {
    manifest(additional)
  }, (error: any) => /not expected/.test(error.message))

  const wrongType = { schema: 'not ok' } as unknown as Manifest

  assert.throws(() => {
    manifest(wrongType)
  }, (error: any) => /object/.test(error.message))
})
