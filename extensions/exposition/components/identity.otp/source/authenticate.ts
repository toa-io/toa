import { redeem, SIGN_IN } from './lib/index.ts'
import type { Context } from './lib/index.ts'

export async function effect(input: Input, context: Context): Promise<Output | Error> {
  const { authority, credentials } = input
  const [username, code] = Buffer.from(credentials, 'base64').toString().split(':')

  if (code === undefined) return ERR_INVALID_CREDENTIALS

  // a code issued with an identity signs in only where the username is that identity's own id:
  // any other is for `confirm`, and would tie the username to an identity of someone else's choosing
  const issued = await redeem(
    {
      authority,
      username,
      code,
      accepts: (value) => value === SIGN_IN || value === username
    },
    context
  )

  if (issued instanceof Error) return issued

  if (issued === username) return { identity: { id: issued } }

  const entry = await context.local.ensure({
    entity: {
      authority,
      username
    }
  })

  if (entry === null) return ERR_NOT_FOUND

  const id = entry.identity ?? entry.id // identity inception

  return { identity: { id } }
}

const ERR_INVALID_CREDENTIALS = new Error('INVALID_CREDENTIALS')

const ERR_NOT_FOUND = new Error('NOT_FOUND')

interface Input {
  authority: string
  credentials: string
}

interface Output {
  identity: {
    id: string
  }
}
