import { it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { environment } from '@toa.io/generic'

import { deployment } from './deployment.js'
import { BINDING, REGION, SELECTOR } from './const.js'
import type { Declaration } from './declaration.js'
import type { Variable } from '@toa.io/operations'

const declaration: Declaration = [
  { region: 'eu', priority: 0, binding: { provider: 'amqp', pointer: 'amqp://eu' } },
  { region: 'us', priority: 1, binding: { provider: 'amqp', pointer: 'amqp://us' } }
]

beforeEach(() => {
  environment.set(SELECTOR, 'us')
})

afterEach(() => {
  environment.delete(SELECTOR)
})

const value = (variables: Variable[], name: string): string | undefined =>
  variables.find((one) => one.name === name)?.value

it('should render the rank of the region it is deployed as', () => {
  const { variables } = deployment([], declaration)

  assert.equal(value(variables!.global, REGION), '1')
})

it('should render the brokers of that region and of no other', () => {
  const { variables } = deployment([], declaration)
  const rendered = JSON.stringify(variables!.global)

  assert.ok(rendered.includes('amqp://us'))
  assert.ok(!rendered.includes('amqp://eu'))
})

it('should render the binding that carries the channel', () => {
  const { variables } = deployment([], declaration)

  assert.equal(value(variables!.global, BINDING), '@toa.io/bindings.amqp')
})

it('should refuse a region the declaration does not carry', () => {
  environment.set(SELECTOR, 'ap')

  assert.throws(() => deployment([], declaration), /does not carry/)
})

it('should refuse to be deployed as no region at all', () => {
  environment.delete(SELECTOR)

  assert.throws(() => deployment([], declaration), /is not set/)
})

it('should refuse two regions of one rank', () => {
  const ambiguous: Declaration = [
    { region: 'eu', priority: 0, binding: { pointer: 'amqp://eu' } },
    { region: 'us', priority: 0, binding: { pointer: 'amqp://us' } }
  ]

  assert.throws(() => deployment([], ambiguous), /priority 0 twice/)
})

it('should refuse a region that declares no brokers', () => {
  const nowhere = [{ region: 'us', priority: 1, binding: {} }] as unknown as Declaration

  assert.throws(() => deployment([], nowhere), /declares the brokers/)
})
