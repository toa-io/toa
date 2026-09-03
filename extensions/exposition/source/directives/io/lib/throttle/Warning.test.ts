import { it, beforeEach, afterEach, mock } from 'node:test'
import assert from 'node:assert/strict'

import { console } from 'openspan'
import { Warning } from './Warning.js'

let warn: ReturnType<typeof mock.method>

beforeEach(() => {
  mock.timers.enable({ apis: ['Date'] })
  warn = mock.method(console, 'warn', () => undefined)
})

afterEach(() => {
  warn.mock.restore()
  mock.timers.reset()
})

it('should write once per interval', () => {
  const warning = new Warning('no ip', 1000)

  warning.emit()
  warning.emit()

  assert.equal(warn.mock.callCount(), 1)

  mock.timers.tick(1000)
  warning.emit()

  assert.equal(warn.mock.callCount(), 2)
  assert.equal(warn.mock.calls[0].arguments[0], 'no ip')
})
