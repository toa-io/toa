import type * as core from '@toa.io/core'
import type { Label } from './discovery'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const broadcast: jest.MockedObject<core.bindings.Broadcast<Label>> = {
  transmit: jest.fn(),
  receive: jest.fn(),
  link: jest.fn()
} as jest.MockedObject<core.bindings.Broadcast<Label>>
