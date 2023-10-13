import { generate } from 'randomstring'
import { Connector } from '@toa.io/core'
import { Remotes } from './Remotes'
import type { Bootloader } from './Factory'
import type { Locator } from '@toa.io/core'

jest.mock('@toa.io/boot', () => ({
  remote: async (locator: Locator) => await boot.remote(locator)
}))

const boot = {
  remote: jest.fn(async (..._) => ({
    connect: jest.fn(() => undefined),
    link: jest.fn(() => undefined)
  }))
} as unknown as jest.MockedObjectDeep<Bootloader>

const namespace = generate()
const name = generate()

let remotes: Remotes

beforeEach(() => {
  remotes = new Remotes(boot)
})

it('should create remote', async () => {
  const remote = await remotes.discover(namespace, name)

  expect(boot.remote).toHaveBeenCalledWith(expect.objectContaining({ namespace, name }))
  expect(remote).toStrictEqual(await boot.remote.mock.results[0].value)
})

it('should be instance of Connector', async () => {
  expect(remotes).toBeInstanceOf(Connector)
})

it('should depend on created remotes', async () => {
  const remote = await remotes.discover(namespace, name)

  expect(remote.link).toHaveBeenCalledWith(remotes)
})
