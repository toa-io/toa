import { FileSystem } from './FileSystem'

it('should be ok', async () => {
  const url = new URL('file:///path')

  expect(() => new FileSystem(url)).not.toThrow()
})

it('should throw if url contains host', async () => {
  const url = new URL('file://host/path')

  expect(() => new FileSystem(url)).toThrow()
})
