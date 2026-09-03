import { it } from 'node:test'
import assert from 'node:assert/strict'

import { DecryptFactory, EncryptFactory, ExportKeyFactory, GenerateKeyFactory, ImportKeyFactory }
  from 'paseto/v3/local'

const generateKey = GenerateKeyFactory().run
const exportKey = ExportKeyFactory().run
const importKey = ImportKeyFactory().run
const encrypt = EncryptFactory().run
const decrypt = DecryptFactory().run

it('should export a generated key as PASERK', async () => {
  const paserk = await exportKey(await generateKey({ extractable: true }))

  assert.match(paserk, /^k3\.local\./)
})

it('should round trip a token', async () => {
  const key = await importKey(await exportKey(await generateKey({ extractable: true })))
  const token = await encrypt(key, { iss: 'test', sub: 'me' })

  assert.match(token, /^v3\.local\./)

  const { claims } = await decrypt(key, token, { allowNonExpiring: true })

  assert.partialDeepStrictEqual(claims, { iss: 'test', sub: 'me' })
})

it('should carry the key id in the footer, which is read without the key', async () => {
  const key = await importKey(await exportKey(await generateKey({ extractable: true })))
  const token = await encrypt(key, { iss: 'test' },
    { footer: new TextEncoder().encode(JSON.stringify({ kid: 'key0' })) })

  // decrypt reads it, and so does anyone holding only the token
  const [, , , footer] = token.split('.')

  assert.deepStrictEqual(JSON.parse(Buffer.from(footer, 'base64url').toString()), { kid: 'key0' })
})

it('should decrypt a token issued under paseto 3', async () => {
  // both written by paseto 3.1.4: the legacy path exists to read tokens already in the wild
  const key = await importKey('k3.local.m28p8SrbS467t-2IUjQuSOqmjvi24TbXhyjAW_dOrog')
  const token = 'v3.local.Fm7vzrYSDh7Kc9j_2eNr4vwWw5jSEOIKrh_vCbteQQP57tFo5xxk7koNIJQNcH9b' +
    'O4yH9ItoC-fWL3ycm-YqBIsadjfbSOvwhffP130-tw3MZZ5PNJzFe6afNa4wxbKpa1bWtOwwULJpAqmZ' +
    '.eyJraWQiOiJsZWdhY3kwIn0'

  const { claims } = await decrypt(key, token, { allowNonExpiring: true })

  assert.partialDeepStrictEqual(claims, { iss: 'legacy', sub: 'old' })
})
