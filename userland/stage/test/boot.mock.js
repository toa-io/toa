import { mock } from 'node:test'

import { generate } from 'randomstring'

const connector = () => ({
  connect: mock.fn(),
  disconnect: mock.fn(),
  link: mock.fn()
})

export const manifest = mock.fn(async () => generate())
export const component = mock.fn(async () => connector())
export const composition = mock.fn(async () => connector())
export const remote = mock.fn(async () => connector())
