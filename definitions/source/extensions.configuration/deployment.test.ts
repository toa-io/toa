import { it } from 'node:test'
import assert from 'node:assert/strict'

import { Locator } from '@toa.io/core'
import {
  type Annotation,
  type Instance,
  deployment,
  describe as map
} from './deployment.ts'
import { epoch, revision } from './epoch.ts'
import { EVENT, REVISION, VALUES } from './const.ts'

const schema = {
  type: 'object',
  properties: { foo: { type: 'string' }, key: { type: 'string' } }
}

function instance(name: string, defaults?: Record<string, unknown>): Instance {
  return {
    locator: new Locator(name, 'configuration'),
    manifest: { schema, defaults },
    component: {} as any
  }
}

it('should validate annotation', async () => {
  const wrongType = 'not ok' as unknown as Annotation

  assert.throws(
    () => deployment([], wrongType),
    (error: any) => /object/.test(error.message)
  )
})

it('should reject unknown components', async () => {
  assert.throws(
    () => deployment([instance('base')], { 'configuration.nope': {} }),
    (error: any) =>
      /Component 'configuration\.nope' does not request configuration/.test(error.message)
  )
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
  const values = map([instance('base', { foo: 'hello' })], {
    'configuration.base': { foo: 'bye' }
  })

  assert.deepStrictEqual(values['configuration.base'].defaults, { foo: 'bye' })
})

it('should give the component the revision of its values, not the values', async () => {
  const dependency = deployment([instance('base')], {
    'configuration.base': { foo: 'set' }
  })

  assert.deepStrictEqual(dependency.variables, {
    'configuration-base': [
      { name: REVISION + 'CONFIGURATION_BASE', value: revision({ foo: 'set' }) }
    ]
  })
})

it('should give the revision of the defaults the values service is given', async () => {
  const instances = [instance('base', { foo: 'hello', key: 'k' })]
  const annotation = { 'configuration.base': { foo: 'bye' } }

  const dependency = deployment(instances, annotation)
  const served = map(instances, annotation)['configuration.base'].defaults

  assert.deepStrictEqual(dependency.variables!['configuration-base'], [
    { name: 'TOA_CONFIGURATION_REVISION_CONFIGURATION_BASE', value: revision(served) }
  ])
})

it('should give a component with no defaults the revision of none', async () => {
  const dependency = deployment([instance('base')])

  assert.deepStrictEqual(dependency.variables!['configuration-base'], [
    { name: REVISION + 'CONFIGURATION_BASE', value: revision({}) }
  ])
})

it('should give each component the revision of its own values', async () => {
  const dependency = deployment([instance('one'), instance('two')], {
    'configuration.one': { foo: 'a' },
    'configuration.two': { foo: 'b' }
  })

  assert.notDeepStrictEqual(
    dependency.variables!['configuration-one'][0].value,
    dependency.variables!['configuration-two'][0].value
  )
})

it('should map secrets to the component', async () => {
  const dependency = deployment([instance('base')], {
    'configuration.base': { key: '$KEY' }
  })

  assert.deepStrictEqual(dependency.variables, {
    'configuration-base': [
      {
        name: 'TOA_CONFIGURATION__KEY',
        secret: { name: 'toa-configuration', key: 'KEY' }
      },
      { name: REVISION + 'CONFIGURATION_BASE', value: revision({ key: '$KEY' }) }
    ]
  })

  // the service holds the reference, not the secret
  assert.deepStrictEqual(
    map([instance('base')], { 'configuration.base': { key: '$KEY' } })[
      'configuration.base'
    ].defaults,
    { key: '$KEY' }
  )
})

it('should accept the annotation of an evicted component', async () => {
  const evicted = instance('evicted')
  const instances = [instance('base'), evicted]

  assert.doesNotThrow(() =>
    deployment([instance('base')], { 'configuration.evicted': { foo: 'set' } }, instances)
  )
})

it('should serve an evicted component', async () => {
  const managed = [instance('base', { foo: 'hello' })]
  const instances = [...managed, instance('evicted')]
  const annotation = { 'configuration.evicted': { foo: 'set' } }

  const dependency = deployment(managed, annotation, instances)
  const variable = dependency.services![0].variables!.find(({ name }) => name === VALUES)

  assert.deepStrictEqual(JSON.parse(variable!.value!), map(instances, annotation))
})

it('should not map secrets to an evicted component', async () => {
  const managed = [instance('base')]
  const instances = [...managed, instance('evicted')]

  const dependency = deployment(
    managed,
    {
      'configuration.base': { key: '$BASE' },
      'configuration.evicted': { key: '$EVICTED' }
    },
    instances
  )

  assert.deepStrictEqual(Object.keys(dependency.variables!), ['configuration-base'])
})

it('should refuse a secret given as a plain string', async () => {
  const secret = {
    type: 'object',
    properties: { key: { type: 'string', format: 'secret' } }
  }

  function keyed(): Instance {
    return {
      locator: new Locator('base', 'configuration'),
      manifest: { schema: secret },
      component: {} as any
    }
  }

  assert.throws(
    () => deployment([keyed()], { 'configuration.base': { key: 'plaintext' } }),
    (error: Error) =>
      /'key' is a secret and must be given as a \$NAME reference/.test(error.message)
  )
})
