import { type Remotes } from './Remotes'
import { type HTTPServer } from './HTTPServer'
import { type Tree } from './RTD/Tree'

export const remotes = {
  connect: jest.fn(),
  link: jest.fn()
} as unknown as jest.MockedObject<Remotes>

export const server = {
  connect: jest.fn(),
  link: jest.fn()
} as unknown as jest.MockedObject<HTTPServer>

export const tree = {
  merge: jest.fn()
} as unknown as jest.MockedObject<Tree>

export { broadcast } from './Factory.fixtures'
