import { mock } from 'node:test'

import { generate } from 'randomstring'

export const component = {
  locator: {
    id: 'foo.bar',
    operations: [
      {
        name: 'get'
      },
      {
        name: 'add'
      },
      {
        name: 'discover'
      }
    ]
  },
  invoke: mock.fn(async () => generate()),
  link: () => null,
  connect: () => null,
  disconnect: () => null
}

export const endpoints = ['get', 'add', 'discover']

export const exposition = {
  locator: {
    id: 'foo.bar'
  },
  invoke: mock.fn(async () => generate())
}
