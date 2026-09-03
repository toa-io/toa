import { mock } from 'node:test'

export const context = {
  apply: mock.fn(),
  call: mock.fn(),
  aspects: [
    {
      name: 'state',
      invoke: mock.fn()
    }
  ],
  link: mock.fn(),
  connect: mock.fn()
}
