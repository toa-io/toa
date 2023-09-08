import { generate } from 'randomstring'
import { effect as encrypt } from './encrypt'
import { computation as decrypt } from './decrypt'
import { type Configuration, type Context, type Identity } from './types'

let configuration: Configuration
let context: Context

beforeEach(() => {
  configuration = {
    key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog',
    key1: 'k3.local.-498jfWenrZH-Dqw3-zQJih_hKzDgBgUMfe37OCqSOA',
    lifetime: 1000,
    refresh: 500
  }

  context = { configuration } as unknown as Context
})

it('should decrypt', async () => {
  const identity: Identity = { id: generate() }
  const lifetime = 10

  const reply = await encrypt({ identity, lifetime }, context)

  if (reply === undefined)
    throw new Error('?')

  const decrypted = await decrypt(reply, context)

  expect(decrypted).toMatchObject({ identity, refresh: false })
})

it('should decrypt with key1', async () => {
  const k1context = {
    configuration: {
      key0: configuration.key1
    }
  } as unknown as Context

  const identity: Identity = { id: generate() }
  const lifetime = 10

  const encrypted = await encrypt({ identity, lifetime }, k1context)

  if (encrypted === undefined)
    throw new Error('?')

  const decrypted = await decrypt(encrypted, context)

  expect(decrypted).toMatchObject({ identity, refresh: true })
})
