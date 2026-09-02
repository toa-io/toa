import { Locator } from '@toa.io/core'
import { type Annotation, type Instance, deployment, describe as map } from './deployment'
import { epoch } from './epoch'
import { EVENT, VALUES } from './const'

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

  expect(() => deployment([], wrongType)).toThrow('object')
})

it('should reject unknown components', async () => {
  expect(() => deployment([instance('base')], { 'configuration.nope': {} }))
    .toThrow("Component 'configuration.nope' does not request configuration")
})

it('should deploy the values service with the map', async () => {
  const instances = [instance('base', { foo: 'hello' }), instance('other')]
  const annotation = { 'configuration.other': { foo: 'set' } }

  const dependency = deployment(instances, annotation)

  expect(dependency.events).toStrictEqual([EVENT])
  expect(dependency.services).toHaveLength(1)

  const service = dependency.services![0]

  expect(service.group).toStrictEqual('configuration')
  expect(service.name).toStrictEqual('values')
  expect(service.components).toStrictEqual(['configuration-values'])

  const variable = service.variables!.find((variable) => variable.name === VALUES)

  expect(variable).toBeDefined()
  expect(JSON.parse(variable!.value!)).toStrictEqual(map(instances, annotation))
})

it('should describe every component', async () => {
  const instances = [instance('base', { foo: 'hello' }), instance('other')]
  const values = map(instances, { 'configuration.other': { foo: 'set' } })

  expect(values).toStrictEqual({
    'configuration.base': { epoch: epoch(schema), schema, defaults: { foo: 'hello' } },
    'configuration.other': { epoch: epoch(schema), schema, defaults: { foo: 'set' } }
  })
})

it('should prefer the context over the manifest defaults', async () => {
  const values = map([instance('base', { foo: 'hello' })], { 'configuration.base': { foo: 'bye' } })

  expect(values['configuration.base'].defaults).toStrictEqual({ foo: 'bye' })
})

it('should not map values to the component', async () => {
  const dependency = deployment([instance('base')], { 'configuration.base': { foo: 'set' } })

  expect(dependency.variables).toStrictEqual({})
})

it('should map secrets to the component', async () => {
  const dependency = deployment([instance('base')], { 'configuration.base': { key: '$KEY' } })

  expect(dependency.variables).toStrictEqual({
    'configuration-base': [{
      name: 'TOA_CONFIGURATION__KEY',
      secret: { name: 'toa-configuration', key: 'KEY' }
    }]
  })

  // the service holds the reference, not the secret
  expect(map([instance('base')], { 'configuration.base': { key: '$KEY' } })['configuration.base'].defaults)
    .toStrictEqual({ key: '$KEY' })
})
