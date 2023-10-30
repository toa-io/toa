import { generate } from 'randomstring'
import { timeout } from '@toa.io/generic'
import { Effect as Encrypt } from './encrypt'
import { computation as decrypt } from './decrypt'
import { type Context, type Identity } from './types'

let encrypt: Encrypt

const context: Context = {} as unknown as Context

beforeEach(() => {
  context.configuration = {
    key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog',
    lifetime: 1000,
    refresh: 2
  }

  encrypt = new Encrypt()
  encrypt.mount(context)
})

it('should encrypt with given lifetime', async () => {
  const identity: Identity = { id: generate() }
  const lifetime = 0.1
  const encrypted = await encrypt.execute({ identity, lifetime })

  if (encrypted === undefined)
    throw new Error('?')

  await expect(decrypt(encrypted, context)).resolves.toMatchObject({ identity })

  await timeout(lifetime * 1000)

  await expect(decrypt(encrypted, context)).resolves.toMatchObject({ message: 'INVALID_TOKEN' })
})
