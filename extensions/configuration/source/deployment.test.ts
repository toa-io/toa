import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Locator } from '@toa.io/core'
import { type Annotation, type Instance, deployment, describe as map } from './deployment.js'
import { epoch } from './epoch.js'
import { EVENT, VALUES } from './const.js'

const schema = {
  type: 'object',
  properties: { foo: { type: 'string' }, key: { type: 'string' } }
}

function instance (name: string, defaults?: Record<string, unknown>): Instance {
  return {
    locator: new Locator(name, 'configuration'),
    manifest: { schema, defaults },
    component: {} as any
  }
}

it('should validate annotation', async () => {
  const wrongType = 'not ok' as unknown as Annotation

  assert.throws(() => deployment([], wrongType), (error: any) => /object/.test(error.message))
})

it('should reject unknown components', async () => {
  assert.throws(() => deployment([instance('base')], { 'configuration.nope': {} }), (error: any) => /Component 'configuration\.nope' does not request configuration/.test(error.message))
})

it('should deploy the values service with the map', async () => {
  const instances = [instance('base', { foo: 'hello' }), instance('other')]
  const annotation = { 'configuration.other': { foo: 'set' } }

  const dependency = deployment(instances, annotation)

  assert.deepStrictEqual(dependency.events, [EVENT])
  assert.strictEqual(dependency.services?.length, 1)

  const service = dependency.services![0]

  assert.deepStrictEqual(service.group, 'configuration')
  assert.deepStrictEqual(service.name, 'values')
  assert.deepStrictEqual(service.components, ['configuration-values'])

  const variable = service.variables!.find((variable) => variable.name === VALUES)

  assert.notStrictEqual(variable, undefined)
  assert.deepStrictEqual(JSON.parse(variable!.value!), map(instances, annotation))
})

it('should describe every component', async () => {
  const instances = [instance('base', { foo: 'hello' }), instance('other')]
  const values = map(instances, { 'configuration.other': { foo: 'set' } })

  assert.deepStrictEqual(values, {
    'configuration.base': { epoch: epoch(schema), schema, defaults: { foo: 'hello' } },
    'configuration.other': { epoch: epoch(schema), schema, defaults: { foo: 'set' } }
  })
})

it('should prefer the context over the manifest defaults', async () => {
  const values = map([instance('base', { foo: 'hello' })], { 'configuration.base': { foo: 'bye' } })

  assert.deepStrictEqual(values['configuration.base'].defaults, { foo: 'bye' })
})

it('should not map values to the component', async () => {
  const dependency = deployment([instance('base')], { 'configuration.base': { foo: 'set' } })

  assert.deepStrictEqual(dependency.variables, {})
})

it('should map secrets to the component', async () => {
  const dependency = deployment([instance('base')], { 'configuration.base': { key: '$KEY' } })

  assert.deepStrictEqual(dependency.variables, {
    'configuration-base': [{
      name: 'TOA_CONFIGURATION__KEY',
      secret: { name: 'toa-configuration', key: 'KEY' }
    }]
  })

  // the service holds the reference, not the secret
  assert.deepStrictEqual(map([instance('base')], { 'configuration.base': { key: '$KEY' } })['configuration.base'].defaults, { key: '$KEY' })
})
