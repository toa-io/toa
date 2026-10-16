import { quote } from '@toa.io/generic'
import { redeem } from './lib/index.ts'
import type { Context } from './lib/index.ts'

export async function effect(input: Input, context: Context): Promise<void | Error> {
  const { authority, username, code, identity } = input

  const issued = await redeem(
    { authority, username, code, accepts: (value) => value === identity },
    context
  )

  if (issued instanceof Error) return issued

  const entry = await context.local.ensure({
    query: { criteria: `authority==${quote(authority)};username==${quote(username)}` },
    entity: { authority, username, identity }
  })

  const bound = entry.identity ?? entry.id // identity inception

  if (bound !== identity) {
    context.logs.debug('OTP username is tied to another identity', {
      authority,
      username
    })

    return ERR_EXISTS
  }

  return undefined
}

const ERR_EXISTS = new Error('EXISTS')

interface Input {
  authority: string
  username: string
  code: string
  identity: string
}
