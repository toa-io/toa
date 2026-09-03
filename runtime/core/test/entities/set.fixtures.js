import { mock } from 'node:test'

import { generate } from 'randomstring'

export const set = [
  { get: mock.fn(() => ({ [generate()]: generate() })) },
  { get: mock.fn(() => ({ [generate()]: generate() })) },
  { get: mock.fn(() => ({ [generate()]: generate() })) }
]
