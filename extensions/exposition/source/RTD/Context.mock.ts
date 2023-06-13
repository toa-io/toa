import { generate } from 'randomstring'
import { type Component } from '@toa.io/core'

const namespace = generate()
const name = generate()

const remote = {
  invoke: jest.fn(async () => generate())
} as unknown as jest.MockedObject<Component>

export const context = { namespace, name, remote }
