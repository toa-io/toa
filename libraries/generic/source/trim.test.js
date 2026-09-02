import { it } from 'node:test'
import assert from 'node:assert/strict'

import { trim } from '../source/index.js'

it('should be', async () => {
  assert.ok(trim instanceof Function)
})

it('should trim input', async () => {
  const trimmed = trim('\nline one\nline two\n\t \t\n')

  assert.deepStrictEqual(trimmed, 'line one\nline two')
})

it('should trim by first line padding', async () => {
  const trimmed = trim('  line one\n  line two')

  assert.deepStrictEqual(trimmed, 'line one\nline two')
})

it('should preserve relative indentation', async () => {
  const trimmed = trim(`
      agents:
        - provider: cursor
          model: fast
  `)

  assert.deepStrictEqual(trimmed, `agents:
  - provider: cursor
    model: fast`)
})

it('should trim tabs by first line padding', async () => {
  const trimmed = trim('\tline one\n\tline two\n\t\tindented')

  assert.deepStrictEqual(trimmed, 'line one\nline two\n\tindented')
})

it('should trim trailing spaces', async () => {
  const trimmed = trim('  line one \n  line two  ')

  assert.deepStrictEqual(trimmed, 'line one\nline two')
})
