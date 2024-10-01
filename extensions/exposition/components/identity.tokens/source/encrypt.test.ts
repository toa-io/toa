import assert from 'node:assert'
import { generate } from 'randomstring'
import { timeout } from '@toa.io/generic'
import { Effect as Encrypt } from './encrypt'
import { computation as decrypt } from './decrypt'
import { type Context, type Identity } from './types'

let encrypt: Encrypt

const context: Context = {} as unknown as Context
const authority = generate()

beforeEach(() => {
  context.configuration = {
    key0: 'k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog',
    lifetime: 1,
    refresh: 2
  }

  encrypt = new Encrypt()
  encrypt.mount(context)
})

it('should encrypt with configured lifetime by default', async () => {
  const identity: Identity = { id: generate() }

  const encrypted = await encrypt.execute({
    authority,
    identity
  })

  if (encrypted instanceof Error)
    throw encrypted

  await expect(decrypt(encrypted, context)).resolves.toMatchObject({ authority, identity })

  await timeout(context.configuration.lifetime * 1000)

  await expect(decrypt(encrypted, context)).resolves.toMatchObject({ code: 'INVALID_TOKEN' })
})

it('should encrypt with given lifetime', async () => {
  const identity: Identity = { id: generate() }
  const lifetime = 0.1

  const encrypted = await encrypt.execute({
    authority,
    identity,
    lifetime
  })

  if (encrypted instanceof Error)
    throw encrypted

  await expect(decrypt(encrypted, context)).resolves.toMatchObject({ authority, identity })

  await timeout(lifetime * 1000)

  await expect(decrypt(encrypted, context)).resolves.toMatchObject({ code: 'INVALID_TOKEN' })
})

it('should encrypt without lifetime INSECURE', async () => {
  const identity: Identity = { id: generate() }
  const lifetime = 0

  const encrypted = await encrypt.execute({
    authority,
    identity,
    lifetime
  })

  if (encrypted instanceof Error)
    throw encrypted

  const decrypted = await decrypt(encrypted, context)

  assert.ok(!(decrypted instanceof Error))

  expect(decrypted.identity).toMatchObject(identity)
})
