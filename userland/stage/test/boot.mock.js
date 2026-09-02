import { mock } from 'node:test'

import { generate } from 'randomstring'

const connector = () => ({
  connect: mock.fn(),
  disconnect: mock.fn(),
  link: mock.fn()
})

const manifest = mock.fn(async () => generate())
const component = mock.fn(async () => connector())
const composition = mock.fn(async () => connector())
const remote = mock.fn(async () => connector())

export { manifest, component, composition, remote }
