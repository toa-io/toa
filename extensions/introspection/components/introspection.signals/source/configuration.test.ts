import { it, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { environment } from '@toa.io/generic'
import { ENV } from '@toa.io/definitions/extensions.introspection'

import { computation } from './configuration.ts'

afterEach(() => {
  environment.delete(ENV)
})

it('should answer what this deployment lets a halt ask for', () => {
  environment.set(ENV, JSON.stringify({ halt: true, duration: [60, 120], quiescence: [30, 90] }))

  assert.deepEqual(computation(), { halt: { duration: [60, 120], quiescence: [30, 90] } })
})

it('should say nothing of a halt where the deployment does not take one', () => {
  environment.set(ENV, JSON.stringify({ halt: false, duration: [60, 120], quiescence: [30, 90] }))

  assert.deepEqual(computation(), {})
})

it('should refuse to answer where introspection is not configured', () => {
  assert.throws(() => computation(), /not configured/)
})
