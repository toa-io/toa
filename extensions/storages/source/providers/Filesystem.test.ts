import { Filesystem } from './Filesystem'

it('should be ok', async () => {
  const url = new URL('file:///path')

  expect(() => new Filesystem(url)).not.toThrow()
})

it('should throw if url contains host', async () => {
  const url = new URL('file://host/path')

  expect(() => new Filesystem(url)).toThrow()
})
