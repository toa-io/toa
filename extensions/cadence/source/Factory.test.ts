import { it, mock } from 'node:test'
import assert from 'node:assert/strict'

import { Locator } from '@toa.io/core'
import { Factory } from './Factory.ts'
import type { Host } from './Factory.ts'
import type { atomicity } from '@toa.io/core/types'

const locator = new Locator('pots', 'tea')

/** an atom as something a connector may depend on, and nothing more */
const connector = (): atomicity.Atom => ({ link: () => {} }) as unknown as atomicity.Atom

const host = (): Host & { atom: ReturnType<typeof mock.fn> } =>
  ({
    atom: mock.fn(connector)
  }) as unknown as Host & { atom: ReturnType<typeof mock.fn> }

it('should coordinate a pulse the component makes as a whole', () => {
  const home = host()

  new Factory(home).tenant(locator, { sweep: { cycle: 60, intervals: 1, scope: 'group' } })

  assert.strictEqual(home.atom.mock.callCount(), 1)
})

it('should coordinate nothing where every pulse is made in every replica', () => {
  const home = host()

  new Factory(home).tenant(locator, { trim: { cycle: 60, intervals: 1, scope: 'replica' } })

  assert.strictEqual(
    home.atom.mock.callCount(),
    0,
    'a component that coordinates nothing asks for nothing to coordinate through'
  )
})
