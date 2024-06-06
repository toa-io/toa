import { compress, decompress } from './compressor'
import type { Identity } from './types'

it('should compress by lines', () => {
  compare(['app:bar:baz', 'app:bar', 'app:foo'],
    ['app:bar', '0:0:baz', '0:foo'])
})

it('should compress with pos', () => {
  compare(['app:bar:baz', 'app:baz', 'app:baz:bar'],
    ['app:bar:baz', '0:0~2', '0:0~2:0~1'])
})

it('should decompress', () => {
  const input = ['app:bar:baz', 'app:foo', 'app:foo:bar']
  const identity: Identity = create(input)

  const { roles } = decompress(compress(identity))

  expect(roles).toEqual(input)
})

function compare (given: string[], expected: string[]): void {
  const identity: Identity = create(given)

  const { roles } = compress(identity)

  expect(roles).toEqual(expected)
}

function create (roles: string[]): Identity {
  return {
    id: 'id',
    scheme: 'scheme',
    refresh: false,
    roles
  }
}
