import { type Annotation, deployment } from './deployment'

it('should validate annotation', async () => {
  const wrongType = 'not ok' as unknown as Annotation

  expect(() => deployment([], wrongType)).toThrow('object')
})
