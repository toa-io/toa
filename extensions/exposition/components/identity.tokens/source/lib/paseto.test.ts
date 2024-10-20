import { V3 } from 'paseto'

it('should be ok', async () => {
  const payload = { iss: 'test', sub: 'me' }
  const key = await V3.generateKey('local', { format: 'paserk' })
  const token = await V3.encrypt(payload, key, { footer: 'key0' })
  const [, , , footer] = token.split('.')
  const kid = Buffer.from(footer, 'base64url').toString('utf-8')

  console.log(footer, kid)
  console.log(key)

  const decrypted = await V3.decrypt(token, key)

  console.log(decrypted)
})
