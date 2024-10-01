import { generate } from 'randomstring'
import { Effect as Encrypt } from './encrypt'
import { Computation as Decrypt } from './decrypt'
import { type Configuration, type Context, type Identity } from './lib'

let configuration: Configuration
let context: Context
let encrypt: Encrypt
let decrypt: Decrypt

const authority = generate()

beforeEach(() => {
  configuration = {
    keys: {
      key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog',
      key1: 'k3.local.-498jfWenrZH-Dqw3-zQJih_hKzDgBgUMfe37OCqSOA'
    },
    lifetime: 1000,
    refresh: 500
  }

  context = { configuration } as unknown as Context

  encrypt = new Encrypt()
  encrypt.mount(context)

  decrypt = new Decrypt()
  decrypt.mount(context)
})

it('should decrypt', async () => {
  const identity: Identity = { id: generate() }
  const lifetime = 100

  const reply = await encrypt.execute({ authority, identity, lifetime })

  if (reply instanceof Error)
    throw reply

  const decrypted = await decrypt.execute(reply)

  expect(decrypted).toMatchObject({ iss: authority, identity, refresh: false })
})

it('should decrypt with key1', async () => {
  const k1context = {
    configuration: {
      keys: {
        key1: configuration.keys.key1
      }
    }
  } as unknown as Context

  encrypt = new Encrypt()
  encrypt.mount(k1context)

  const identity: Identity = { id: generate() }
  const lifetime = 100

  const encrypted = await encrypt.execute({ authority, identity, lifetime })

  if (encrypted instanceof Error)
    throw encrypted

  const decrypted = await decrypt.execute(encrypted)

  expect(decrypted).toMatchObject({ identity, refresh: true })
})
