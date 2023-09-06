import { generate } from 'randomstring'
import { timeout } from '@toa.io/generic'
import { effect as encrypt } from './encrypt'
import { computation as decrypt } from './decrypt'
import { type Context, type Identity } from './types'

const context: Context = {} as unknown as Context

beforeEach(() => {
  context.configuration = {
    key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog',
    lifetime: 1000,
    refresh: 2
  }
})

it('should encrypt with given lifetime', async () => {
  const identity: Identity = { id: generate() }
  const lifetime = 10
  const encrypted = await encrypt({ identity, lifetime }, context)

  if (encrypted.output === undefined)
    throw new Error('?')

  await expect(decrypt(encrypted.output, context)).resolves.toMatchObject({ output: { identity } })

  await timeout(lifetime)

  await expect(decrypt(encrypted.output, context)).resolves.toMatchObject({ error: { code: 0 } })
})
