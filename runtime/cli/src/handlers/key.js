import { randomBytes } from 'node:crypto'
import { ExportKeyFactory, GenerateKeyFactory } from 'paseto/v3/local'
import { ExportPublicKeyFactory, ExportSecretKeyFactory, GenerateKeyPairFactory }
  from 'paseto/v3/public'

export async function key (argv) {
  if (!argv.public && argv.format === 'jwe') {
    console.log(randomBytes(32).toString('base64url'))
    return
  }

  if (argv.public) {
    const pair = await GenerateKeyPairFactory().run({ extractable: true })

    console.log(await ExportSecretKeyFactory().run(pair.secretKey))
    console.log(await ExportPublicKeyFactory().run(pair.publicKey))
  } else {
    const local = await GenerateKeyFactory().run({ extractable: true })

    console.log(await ExportKeyFactory().run(local))
  }
}
