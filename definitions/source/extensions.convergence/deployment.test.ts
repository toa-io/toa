import { it } from 'node:test'
import assert from 'node:assert/strict'

import { deployment } from './deployment.js'
import { BINDING, REGION } from './const.js'
import type { Declaration } from './declaration.js'
import type { Variable } from '@toa.io/operations'

const declaration: Declaration = {
  priority: 1,
  binding: { provider: 'amqp', pointer: 'amqp://us' }
}

const value = (variables: Variable[], name: string): string | undefined =>
  variables.find((one) => one.name === name)?.value

it('should render the rank of the region it is deployed as', () => {
  const { variables } = deployment([], declaration)

  assert.equal(value(variables!.global, REGION), '1')
})

it('should render the brokers of that region', () => {
  const { variables } = deployment([], declaration)

  assert.ok(JSON.stringify(variables!.global).includes('amqp://us'))
})

it('should deploy the credentials of those brokers as secrets', () => {
  const { variables } = deployment([], declaration)
  const secrets = variables!.global.filter((one) => one.secret !== undefined)

  assert.equal(secrets.length, 2)
})

it('should render the binding that carries the channel', () => {
  const { variables } = deployment([], declaration)

  assert.equal(value(variables!.global, BINDING), '@toa.io/bindings.amqp')
})

it('should take a list of brokers', () => {
  const { variables } = deployment([], {
    ...declaration,
    binding: { pointer: ['amqp://us-0', 'amqp://us-1'] }
  })

  const rendered = JSON.stringify(variables!.global)

  assert.ok(rendered.includes('amqp://us-0'))
  assert.ok(rendered.includes('amqp://us-1'))
})

it('should refuse a rank that is not one', () => {
  assert.throws(() => deployment([], { ...declaration, priority: -1 }), /rank/)
  assert.throws(
    () => deployment([], { ...declaration, priority: 1.5 } as Declaration),
    /rank/
  )
  assert.throws(() => deployment([], {} as Declaration), /rank/)
})

it('should refuse a region that declares no brokers', () => {
  const nowhere = { priority: 1, binding: {} } as unknown as Declaration

  assert.throws(() => deployment([], nowhere), /declares the brokers/)
})
