import { mock } from 'node:test'

import { generate } from 'randomstring'

export const name = mock.fn(() => generate())

export const tasks = mock.fn(() => generate())

export const instances = mock.fn(() => generate())

export const scoped = mock.fn((name) => name)
