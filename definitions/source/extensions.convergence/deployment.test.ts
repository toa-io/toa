import { it } from 'node:test'
import assert from 'node:assert/strict'

import { environment } from '@toa.io/generic'
import { resolve } from '@toa.io/pointer'

import { deployment } from './deployment.ts'
import { BINDING, BROKERS, ID, REGION } from './const.ts'
import type { Declaration } from './declaration.ts'
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

it('should take a list of brokers, and the runtime should read every one back', () => {
  const brokers = ['amqp://us-0', 'amqp://us-1']
  const { variables } = deployment([], { ...declaration, binding: { pointer: brokers } })

  // the deploy writes one variable and the runtime resolves it, so what a region converges
  // over is only whole if the two agree on how a list is written down
  for (const variable of variables!.global)
    if (variable.value !== undefined) environment.set(variable.name, variable.value)

  try {
    assert.deepEqual(resolve(ID, BROKERS), brokers)
  } finally {
    for (const variable of variables!.global) environment.delete(variable.name)
  }
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
