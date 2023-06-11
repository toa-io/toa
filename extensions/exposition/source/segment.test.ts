import { segment } from './segment'

it('should return segments', async () => {
  expect(segment('/foo/bar')).toStrictEqual(['foo', 'bar'])
})
