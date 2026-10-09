import { it } from 'node:test'
import assert from 'node:assert/strict'

import { manifest } from './manifest.ts'
import type { Manifest } from '@toa.io/norm'

const component = {
  operations: {
    sweep: { type: 'effect' },
    gather: { type: 'transition' },
    peek: { type: 'observation' }
  }
} as unknown as Manifest

it('should normalize a declaration', () => {
  const declaration = manifest({ sweep: { cycle: 86400, intervals: 24 } }, component)

  assert.deepStrictEqual(declaration, {
    sweep: [{ cycle: 86400, intervals: 24, scope: 'group' }]
  })
})

it('should split a cycle into one interval by default', () => {
  const declaration = manifest({ sweep: { cycle: 3600 } }, component)

  assert.deepStrictEqual(declaration, {
    sweep: [{ cycle: 3600, intervals: 1, scope: 'group' }]
  })
})

it('should expand the shorthand', () => {
  const declaration = manifest({ sweep: 3600 }, component)

  assert.deepStrictEqual(declaration, {
    sweep: [{ cycle: 3600, intervals: 1, scope: 'group' }]
  })
})

it('should answer a component that only delays calls', () => {
  assert.deepStrictEqual(manifest(null, component), {})
})

it('should refuse an undefined operation', () => {
  assert.throws(
    () => manifest({ nothing: 3600 }, component),
    /refers to undefined operation 'nothing'/
  )
})

it('should refuse an operation that produces no side effects', () => {
  assert.throws(() => manifest({ peek: 3600 }, component), /of the allowed types/)
})

it('should keep a pulse every replica makes', () => {
  const declaration = manifest({ sweep: { cycle: 3600, scope: 'replica' } }, component)

  assert.deepStrictEqual(declaration, {
    sweep: [{ cycle: 3600, intervals: 1, scope: 'replica' }]
  })
})

it('should split a cycle a pulse every replica makes', () => {
  const declaration = manifest(
    { sweep: { cycle: 86400, intervals: 24, scope: 'replica' } },
    component
  )

  assert.deepStrictEqual(declaration, {
    sweep: [{ cycle: 86400, intervals: 24, scope: 'replica' }]
  })
})

it('should refuse a scope that is neither', () => {
  assert.throws(() =>
    manifest({ sweep: { cycle: 60, scope: 'process' } } as any, component)
  )
})

it('should refuse an interval shorter than a second', () => {
  assert.throws(
    () => manifest({ sweep: { cycle: 60, intervals: 61 } }, component),
    /less than a second/
  )
})

it('should refuse a cycle of no time at all', () => {
  assert.throws(() => manifest({ sweep: { cycle: 0, intervals: 1 } }, component))
})

it('should refuse what the declaration does not describe', () => {
  assert.throws(() => manifest({ sweep: { cycle: 60, every: 3 } } as any, component))
})

it('should read a string as a schedule, in UTC', () => {
  const declaration = manifest({ sweep: '0 12 * * 1-5' }, component)

  assert.deepStrictEqual(declaration, {
    sweep: [{ schedule: '0 12 * * 1-5', zone: 'UTC' }]
  })
})

it('should keep what a schedule states', () => {
  const stated = {
    schedule: '0 9 * * 1',
    zone: 'Europe/Berlin',
    overdue: 3600,
    region: 1
  }

  assert.deepStrictEqual(manifest({ sweep: stated }, component), { sweep: [stated] })
})

it('should read an expression with seconds', () => {
  assert.doesNotThrow(() => manifest({ sweep: '*/2 * * * * *' }, component))
})

it('should keep a list of entries, of either kind', () => {
  const declaration = manifest(
    { sweep: [3600, { schedule: '0 3 1 * *', region: 0 }, { cycle: 60, region: 1 }] },
    component
  )

  assert.deepStrictEqual(declaration, {
    sweep: [
      { cycle: 3600, intervals: 1, scope: 'group' },
      { schedule: '0 3 1 * *', zone: 'UTC', region: 0 },
      { cycle: 60, intervals: 1, scope: 'group', region: 1 }
    ]
  })
})

it('should refuse a list of nothing', () => {
  assert.throws(() => manifest({ sweep: [] }, component), /Invalid cadence declaration/)
})

it('should refuse an entry that is both kinds, or neither', () => {
  assert.throws(
    () => manifest({ sweep: { cycle: 60, schedule: '* * * * *' } } as any, component),
    /both a cycle and a schedule/
  )

  assert.throws(
    () => manifest({ sweep: { region: 0 } } as any, component),
    /neither a cycle nor a schedule/
  )
})

it('should refuse beside a schedule what belongs to a pulse', () => {
  for (const stray of [{ intervals: 2 }, { scope: 'group' }, { scope: 'replica' }])
    assert.throws(
      () => manifest({ sweep: { schedule: '* * * * *', ...stray } } as any, component),
      /Invalid schedule 'sweep'/
    )
})

it('should refuse beside a cycle what belongs to a schedule', () => {
  for (const stray of [{ zone: 'UTC' }, { overdue: 60 }])
    assert.throws(
      () => manifest({ sweep: { cycle: 60, ...stray } } as any, component),
      /Invalid pulse 'sweep'/
    )
})

it('should refuse a schedule with no bound on lateness, or a negative one', () => {
  for (const overdue of [null, -1])
    assert.throws(
      () => manifest({ sweep: { schedule: '* * * * *', overdue } } as any, component),
      /Invalid schedule 'sweep'/
    )
})

it('should refuse an expression that does not parse', () => {
  for (const expression of [
    'nope',
    '61 * * * *',
    '* * * *',
    '@daily',
    '0 0 12 * * * 2040'
  ])
    assert.throws(
      () => manifest({ sweep: expression }, component),
      /Invalid schedule 'sweep'/
    )
})

it('should refuse an expression that never comes due', () => {
  assert.throws(() => manifest({ sweep: '0 0 30 2 *' }, component), /never comes due/)
})

it('should refuse a zone that is not one', () => {
  assert.throws(
    () => manifest({ sweep: { schedule: '* * * * *', zone: 'Mars/Olympus' } }, component),
    /Invalid schedule 'sweep'/
  )
})

it('should refuse a region beside a pulse every replica makes', () => {
  assert.throws(
    () => manifest({ sweep: { cycle: 60, scope: 'replica', region: 0 } }, component),
    /cannot name a region/
  )
})

it('should refuse a schedule of an operation that produces no side effects', () => {
  assert.throws(() => manifest({ peek: '* * * * *' }, component), /of the allowed types/)
})
