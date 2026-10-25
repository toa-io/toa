import { it } from 'node:test'
import assert from 'node:assert/strict'

import { id, literal } from './ddl.ts'

it('should refuse an identifier that is neither a scope nor a name', () => {
  assert.throws(() => id('shop; DROP DATABASE x'))
  assert.throws(() => id('shop`x'))
  assert.equal(id('shop_1'), '`shop_1`')
  assert.equal(id('app-agent-0a1b2c'), '`app-agent-0a1b2c`')
})

it('should escape a literal', () => {
  assert.equal(literal("it's \\ fine"), "'it\\'s \\\\ fine'")
})
