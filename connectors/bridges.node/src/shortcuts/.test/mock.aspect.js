import { mock } from 'node:test'

import { generate } from 'randomstring'

const aspect = {
  invoke: mock.fn(async () => generate)
}

export { aspect }
