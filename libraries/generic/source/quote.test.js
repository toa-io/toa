import { it } from 'node:test'
import assert from 'node:assert/strict'

import { quote } from '../source/quote.js'

it('should wrap a value in double quotes', () => {
  assert.strictEqual(quote('hello'), '"hello"')
})

it('should keep the grammar characters inside the quotes', () => {
  assert.strictEqual(quote('a,b==c;(d)'), '"a,b==c;(d)"')
})

it('should escape quotes and backslashes', () => {
  assert.strictEqual(quote('say "hi" \\ bye'), '"say \\"hi\\" \\\\ bye"')
})

it('should quote an empty value', () => {
  assert.strictEqual(quote(''), '""')
})
