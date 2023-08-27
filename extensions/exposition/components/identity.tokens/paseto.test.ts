import { V3 } from 'paseto'

it('should generete secret', async () => {
  const key = await V3.generateKey('local', { format: 'paserk' })
  const exp = new Date(Date.now() + 3600 * 1000 * 24 * 180).toISOString()
  const payload = { identity: { id: '1' }, exp }
  const token = await V3.encrypt(payload, key, { iat: false })
  const decrypted = await V3.decrypt(token, key)

  console.log(new Date(Date.now() + 15552000 * 1000).toISOString())

  console.log(token)
  console.log(decrypted)

  expect(1).toBeDefined()
})
