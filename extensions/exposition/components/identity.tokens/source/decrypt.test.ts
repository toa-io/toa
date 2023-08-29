import { generate } from 'randomstring'
import { effect as encrypt } from './encrypt'
import { computation as decrypt } from './decrypt'
import { type Configuration, type Context } from './types'

let configuration: Configuration
let context: Context

beforeEach(() => {
  configuration = {
    key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog',
    reissue: 0.25
  }

  context = { configuration } as unknown as Context
})

it('should decrypt', async () => {
  const payload = { [generate()]: generate() }
  const lifetime = 1

  const encrypted = await encrypt({ payload, lifetime }, context)

  if (encrypted.output === undefined)
    throw new Error('?')

  const decrypted = await decrypt(encrypted.output, context)

  expect(decrypted.output).toMatchObject({ payload })
})
