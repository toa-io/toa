import { generate } from 'randomstring'
import { type Component } from '@toa.io/core'
import { type Remotes } from '../Remotes'

const remote = (): jest.MockedObject<Component> => ({
  invoke: jest.fn(async () => generate())
} as unknown as jest.MockedObject<Component>)

export const remotes = {
  discover: jest.fn(async () => remote())
} as unknown as jest.MockedObject<Remotes>

export const context = { remotes }
