import { generate } from 'randomstring'
import { effect as encrypt } from './encrypt'
import { computation as decrypt } from './decrypt'
import { type Configuration, type Context } from './types'

let configuration: Configuration
let context: Context

beforeEach(() => {
  configuration = {
    key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog',
    key1: 'k3.local.-498jfWenrZH-Dqw3-zQJih_hKzDgBgUMfe37OCqSOA',
    lifetime: 1,
    refresh: 0.25
  }

  context = { configuration } as unknown as Context
})

it('should decrypt', async () => {
  const payload = { [generate()]: generate() }
  const lifetime = 1

  const reply = await encrypt({ payload, lifetime }, context)

  if (reply.output === undefined)
    throw new Error('?')

  const decrypted = await decrypt(reply.output, context)

  expect(decrypted.output).toMatchObject({ payload, refresh: false })
})

it('should decrypt with key1', async () => {
  const k1context = {
    configuration: {
      key0: configuration.key1
    }
  } as unknown as Context

  const payload = { [generate()]: generate() }
  const lifetime = 1

  const encrypted = await encrypt({ payload, lifetime }, k1context)

  if (encrypted.output === undefined)
    throw new Error('?')

  const decrypted = await decrypt(encrypted.output, context)

  expect(decrypted.output).toMatchObject({ payload, refresh: true })
})
