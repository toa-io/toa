import { type Manifest, manifest } from './manifest'

it('should validate', async () => {
  const missingRequired = {} as unknown as Manifest

  expect(() => {
    manifest(missingRequired)
  }).toThrow('required')

  const additional = { schema: {}, foo: 'bar' } as unknown as Manifest

  expect(() => {
    manifest(additional)
  }).toThrow('additional')

  const wrongType = { schema: 'not ok' } as unknown as Manifest

  expect(() => {
    manifest(wrongType)
  }).toThrow('object')
})
