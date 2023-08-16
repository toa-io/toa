import { segment, fragmet } from './segment'

it('should return segments', async () => {
  const segments = segment('/foo/bar/')

  expect(segments).toHaveLength(2)
  expect(segments[0].fragment).toBe('foo')
  expect(segments[1].fragment).toBe('bar')
})

it('should parse placeholders', async () => {
  const segments = segment('/foo/:id/')

  expect(segments).toHaveLength(2)
  expect(segments[0].fragment).toBe('foo')
  expect(segments[1].fragment).toBeNull()

  // helping typescript
  if (segments[1].fragment !== null) throw new Error('?')

  expect(segments[1].placeholder).toBe('id')
})

it('should handle root path', async () => {
  expect(segment('/')).toStrictEqual([])
})

it('should split', async () => {
  const parts = fragmet('/foo/bar/')

  expect(parts).toStrictEqual(['foo', 'bar'])
})
