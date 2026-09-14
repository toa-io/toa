import { it } from 'node:test'
import assert from 'node:assert/strict'

import { deployment } from './deployment.ts'
import type { Declaration } from './annotation.ts'
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

it('should refuse nothing where halts are off', () => {
  const instances = [instance('billing.invoices', false)]

  assert.doesNotThrow(() => deployment(instances, {}))
})
