import { type Remotes } from './Remotes'
import { type Server } from './HTTP'
import { type Tree } from './RTD'

export const remotes = {
  connect: jest.fn(),
  link: jest.fn()
} as unknown as jest.MockedObject<Remotes>

export const server = {
  attach: jest.fn(),
  connect: jest.fn(),
  link: jest.fn()
} as unknown as jest.MockedObject<Server>

export const tree = {
  match: jest.fn(),
  merge: jest.fn()
} as unknown as jest.MockedObject<Tree<any, any>>

export { broadcast } from './Factory.fixtures'
