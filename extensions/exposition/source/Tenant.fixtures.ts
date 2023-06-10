import * as core from '@toa.io/core'

export const broadcast = <jest.MockedObject<core.bindings.Broadcast>>{
  transmit: jest.fn(),
  receive: jest.fn(),
  link: jest.fn()
}
