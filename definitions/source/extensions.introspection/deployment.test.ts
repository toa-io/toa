import { it } from 'node:test'
import assert from 'node:assert/strict'

import { deployment } from './deployment.ts'
import type { Annotation, Declaration } from './annotation.ts'
import type { Instances } from '@toa.io/operations'

const instance = (id: string, manifest: Declaration): Instances<Declaration>[number] => {
  const [namespace, name] = id.split('.')

  return {
    locator: { id, namespace, name },
    manifest,
    component: {}
  } as Instances<Declaration>[number]
}

it('should deploy a component that is on the map', () => {
  const instances = [instance('billing.invoices', {})]

  assert.doesNotThrow(() => deployment(instances, { halt: true }))
})

/*
 * The check a halt is decided by is the map, so a component the map does not describe could
 * be called while the deployment is being declared still.
 */
it('should refuse a component that is not on the map where halts are on', () => {
  const instances = [instance('billing.invoices', false), instance('billing.ledger', false)]

  assert.throws(
    () => deployment(instances, { halt: true }),
    /billing\.invoices, billing\.ledger/
  )
})

it('should leave the extension its own opt-out', () => {
  const instances = [instance('introspection.edges', false)]

  assert.doesNotThrow(() => deployment(instances, { halt: true }))
})

it('should hold a halt to what the runtime allows where the deployment says nothing', () => {
  const [{ value }] = deployment([], { halt: true }).variables!.global

  assert.deepEqual(JSON.parse(value!).duration, [30, 3600])
  assert.deepEqual(JSON.parse(value!).quiescence, [30, 1800])
})

it('should take the bounds a deployment states for itself', () => {
  const annotation = { halt: { duration: [60, 120], quiescence: [0, 30] } } as Annotation
  const [{ value }] = deployment([], annotation).variables!.global

  assert.deepEqual(JSON.parse(value!).duration, [60, 120])
  assert.deepEqual(JSON.parse(value!).quiescence, [0, 30])
})

it('should refuse a pair whose first is not the smaller', () => {
  const annotation = { halt: { duration: [120, 60] } } as Annotation

  assert.throws(() => deployment([], annotation), /'halt.duration' is \[120, 60\]/)
})

it('should refuse a bound that is not a non-negative pair of integers', () => {
  // `'30'` is not among them: what a schema reads out of YAML is coerced, here as everywhere
  const refused = [[-1, 60], [30], [30, 60, 90], [1.5, 60]]

  for (const duration of refused)
    assert.throws(
      () => deployment([], { halt: { duration } } as Annotation),
      TypeError,
      JSON.stringify(duration)
    )
})

it('should refuse nothing where halts are off', () => {
  const instances = [instance('billing.invoices', false)]

  assert.doesNotThrow(() => deployment(instances, {}))
})
