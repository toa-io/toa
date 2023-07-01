import { generate } from 'randomstring'
import { Locator } from '@toa.io/core'
import { resolve } from './resolve'

const id = generate()
const locator = new Locator(generate(), generate())

const host = 'host-' + generate()
  .toLowerCase()

const value = 'http://' + host + '/'

beforeEach(() => {
  for (const name of env)
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete process.env[name]

  env.clear()
})

it('should resolve URL', async () => {
  setEnv(value)

  const urls = resolve(id, locator.id)

  expect(urls)
    .toStrictEqual([value])
})

it('should throw if variable is not set', async () => {
  expect(() => resolve(id, locator.id))
    .toThrow('is not set.')
})

it('should resolve credentials', async () => {
  const username = generate()
  const password = generate()

  setEnv(value, username, password)

  const urls = resolve(id, locator.id)
  const url = new URL(value)

  url.username = username
  url.password = password

  expect(urls)
    .toStrictEqual([url.href])
})

function setEnv (value: string, username?: string, password?: string): void {
  const name = `TOA_${id.toUpperCase()}_${locator.uppercase}`

  setValue(name, value)

  if (username !== undefined)
    setValue(name + '_USERNAME', username)

  if (password !== undefined)
    setValue(name + '_PASSWORD', password)
}

function setValue (name: string, value: string): void {
  process.env[name] = value
  env.add(name)
}

const env = new Set<string>()
