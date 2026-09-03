import { mock } from 'node:test'

import { generate } from 'randomstring'

export const aspect = {
  invoke: mock.fn(async () => generate)
}
