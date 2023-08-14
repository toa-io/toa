import { type Annotation, deployment, type Instance } from './deployment'
import { type Manifest } from './manifest'

it('should validate annotation', async () => {
  const wrongType = 'not ok' as unknown as Annotation

  expect(() => deployment([], wrongType)).toThrow('object')
})

it('should validate values', async () => {
  const manifest: Manifest = {
    schema: { foo: 'string', bar: 'number' },
    defaults: { foo: 'ok', bar: 0 }
  }

  const locator = { id: 'component' }
  const instances = [{ manifest, locator }] as unknown as Instance[]
  const annotation: Annotation = { [locator.id]: { bar: 'not a number' } }

  expect(() => deployment(instances, annotation)).toThrow('number')
})
