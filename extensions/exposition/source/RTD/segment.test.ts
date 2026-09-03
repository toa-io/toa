import { it } from 'node:test'
import assert from 'node:assert/strict'

import { segment, fragment } from './segment.js'

it('should return segments', async () => {
  const segments = segment('/foo/bar/')

  assert.strictEqual(segments.length, 2)
  assert.strictEqual(segments[0].fragment, 'foo')
  assert.strictEqual(segments[1].fragment, 'bar')
})

it('should parse placeholders', async () => {
  const segments = segment('/foo/:id/')

  assert.strictEqual(segments.length, 2)
  assert.strictEqual(segments[0].fragment, 'foo')
  assert.strictEqual(segments[1].fragment, null)

  // helping typescript
  if (segments[1].fragment !== null) throw new Error('?')

  assert.strictEqual(segments[1].placeholder, 'id')
})

it('should handle root path', async () => {
  assert.deepStrictEqual(segment('/'), [])
})

it('should split', async () => {
  const parts = fragment('/foo/bar/')

  assert.deepStrictEqual(parts, ['foo', 'bar'])
})
