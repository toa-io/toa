import { it } from 'node:test'
import assert from 'node:assert/strict'

import { deployment } from './deployment.js'
import { DISCRETENESS, REGIONS } from './const.js'
import type { Annotation } from './types.js'
import type { Variable } from '@toa.io/operations'

const variables = (annotation?: Annotation | null): Variable[] =>
  deployment(null, annotation).services![0].variables ?? []

const value = (annotation: Annotation | null | undefined, name: string): string | undefined =>
  variables(annotation).find((one) => one.name === name)?.value

it('should carry the interval in milliseconds', () => {
  assert.equal(value(null, 'TOA_CADENCE_DISCRETENESS'), String(DISCRETENESS * 1000))
  assert.equal(value({ discreteness: 5 }, 'TOA_CADENCE_DISCRETENESS'), '5000')
})

it('should say nothing of regions where an application does not', () => {
  // the metronome then makes the calls of the region it is deployed as, which is what a
  // deployment that is no region at all does anyway
  assert.equal(value(null, REGIONS), undefined)
})

it('should carry the regions whose calls this deployment makes', () => {
  assert.equal(value({ regions: [0, 1] }, REGIONS), '0 1')
})

it('should refuse a rank that is not one', () => {
  assert.throws(() => variables({ regions: [-1] } as Annotation), /Invalid cadence annotation/)
  assert.throws(() => variables({ regions: [] } as Annotation), /Invalid cadence annotation/)
  assert.throws(
    () => variables({ regions: [0, 0] } as Annotation),
    /Invalid cadence annotation/
  )
})
