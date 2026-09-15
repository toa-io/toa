import { it, afterEach } from 'node:test'
import assert from 'node:assert/strict'

import { environment } from '@toa.io/generic'
import { ENV } from '@toa.io/definitions/extensions.introspection'
import { components } from './Composition.ts'

const SIGNALS = 'introspection-signals'

function options (halt: boolean): string {
  return JSON.stringify({
    interval: 300,
    threshold: 1024,
    ui: true,
    halt,
    duration: [30, 3600],
    quiescence: [30, 1800]
  })
}

afterEach(() => {
  environment.delete(ENV)
})

it('should host the signals component where halts are on', () => {
  environment.set(ENV, options(true))

  assert.ok(components().labels.includes(SIGNALS))
})

it('should not host it where halts are off', () => {
  environment.set(ENV, options(false))

  assert.ok(!components().labels.includes(SIGNALS))
})

/** what a deployment renders nothing for; see `components` in `@toa.io/definitions` */
it('should not host it where nothing says', () => {
  assert.ok(!components().labels.includes(SIGNALS))
})
