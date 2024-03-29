import { type Manifest, manifest } from './manifest'

it('should validate', async () => {
  const additional = { schema: {}, foo: 'bar' } as unknown as Manifest

  expect(() => {
    manifest(additional)
  }).toThrow('not expected')

  const wrongType = { schema: 'not ok' } as unknown as Manifest

  expect(() => {
    manifest(wrongType)
  }).toThrow('object')
})
