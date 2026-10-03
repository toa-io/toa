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

  new Factory(home).tenant(locator, { sweep: [{ cycle: 60, intervals: 1, scope: 'group' }] })

  assert.strictEqual(home.atom.mock.callCount(), 1)
})

it('should coordinate nothing where every pulse is made in every replica', () => {
  const home = host()

  new Factory(home).tenant(locator, { trim: [{ cycle: 60, intervals: 1, scope: 'replica' }] })

  assert.strictEqual(
    home.atom.mock.callCount(),
    0,
    'a component that coordinates nothing asks for nothing to coordinate through'
  )
})

it('should build nothing for an entry another region makes', () => {
  const home = host()

  new Factory(home).tenant(locator, {
    sweep: [{ cycle: 60, intervals: 1, scope: 'group', region: 7 }]
  })

  assert.strictEqual(home.atom.mock.callCount(), 0)
})

it('should build an entry of a region this deployment was told to make the work of', (t) => {
  process.env.TOA_CADENCE_REGIONS = '0 7'
  t.after(() => delete process.env.TOA_CADENCE_REGIONS)

  const home = host()

  new Factory(home).tenant(locator, {
    sweep: [{ cycle: 60, intervals: 1, scope: 'group', region: 7 }]
  })

  assert.strictEqual(home.atom.mock.callCount(), 1)
})

it('should build every entry of a list, of either kind', () => {
  const home = host()

  const tenant = new Factory(home).tenant(locator, {
    sweep: [
      { cycle: 60, intervals: 1, scope: 'group' },
      { schedule: '0 3 1 * *', zone: 'UTC' }
    ]
  })

  assert.strictEqual(home.atom.mock.callCount(), 1)
  assert.ok(tenant)
})
