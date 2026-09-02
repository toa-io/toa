import { mock } from 'node:test'

import { generate } from 'randomstring'

const connection = {
  table: generate(),
  connection: mock.fn(),
  link: mock.fn(),
  connect: mock.fn(),
  disconnect: mock.fn(),

  insert: mock.fn(() => true),
  update: mock.fn(() => true)
}

export { connection }
