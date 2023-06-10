import * as core from '@toa.io/core'

// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const broadcast: jest.MockedObject<core.bindings.Broadcast> = {
  transmit: jest.fn(),
  receive: jest.fn(),
  link: jest.fn()
} as jest.MockedObject<core.bindings.Broadcast>
