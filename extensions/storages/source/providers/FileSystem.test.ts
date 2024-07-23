import { FileSystem } from './FileSystem'

it('should be ok', async () => {
  expect(() => new FileSystem({ path: 'path' })).not.toThrow()
})

it('should expose path', () => {
  const fs = new FileSystem({ path: '/tmp/foo' })

  expect(fs.path).toBe('/tmp/foo')
})
