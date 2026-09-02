import { V3 } from 'paseto'
import { randomBytes } from 'node:crypto'

async function key (argv) {
  if (!argv.public && argv.format === 'jwe') {
    console.log(randomBytes(32).toString('base64url'))
    return
  }

  const purpose = argv.public ? 'public' : 'local'
  const key = await V3.generateKey(purpose, { format: 'paserk' })

  if (argv.public) {
    console.log(key.secretKey)
    console.log(key.publicKey)
  } else
    console.log(key)
}

export { key }
