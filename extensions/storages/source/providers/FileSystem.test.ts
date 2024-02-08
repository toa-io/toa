import { FileSystem } from './FileSystem'

it('should be ok', async () => {
  expect(() => new FileSystem({ path: 'path' })).not.toThrow()
})
