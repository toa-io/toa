import { segment } from './segment'

it('should return segments', async () => {
  expect(segment('/foo/bar')).toStrictEqual(['foo', 'bar'])
})

it('should replace placeholders with nulls', async () => {
  expect(segment('/:id/foo')).toStrictEqual([null, 'foo'])
})

it('should handle root path', async () => {
  expect(segment('/')).toStrictEqual([])
})
