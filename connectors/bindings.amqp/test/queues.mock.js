import { mock } from 'node:test'

import { generate } from 'randomstring'

const name = mock.fn(() => generate())

export { name }
