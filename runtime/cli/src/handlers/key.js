import { randomBytes } from 'node:crypto'

import { needs, PASETO } from '../util/needs.js'

export async function key(argv) {
  if (!argv.public && argv.format === 'jwe') {
    console.log(randomBytes(32).toString('base64url'))
    return
  }

  if (argv.public) {
    const { ExportPublicKeyFactory, ExportSecretKeyFactory, GenerateKeyPairFactory } =
      await needs('key', () => import('paseto/v3/public'), PASETO)

    const pair = await GenerateKeyPairFactory().run({ extractable: true })

    console.log(await ExportSecretKeyFactory().run(pair.secretKey))
    console.log(await ExportPublicKeyFactory().run(pair.publicKey))
  } else {
    const { ExportKeyFactory, GenerateKeyFactory } = await needs(
      'key',
      () => import('paseto/v3/local'),
      PASETO
    )

    const local = await GenerateKeyFactory().run({ extractable: true })

    console.log(await ExportKeyFactory().run(local))
  }
}
