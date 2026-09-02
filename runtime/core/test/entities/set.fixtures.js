import { mock } from 'node:test'

import { generate } from 'randomstring'

const set = [
  { get: mock.fn(() => ({ [generate()]: generate() })) },
  { get: mock.fn(() => ({ [generate()]: generate() })) },
  { get: mock.fn(() => ({ [generate()]: generate() })) }
]

export { set }
