import { randomInt } from 'node:crypto'
import { SIGN_IN } from './lib/index.ts'
import type { Context } from './lib/index.ts'

export async function effect(input: Input, context: Context): Promise<Output> {
  const { authority, username, identity } = input
  const code = randomInt(100000, 1000000).toString()
  const key = `${authority}:${username}:${code}`
  const lifetime = input.lifetime ?? context.configuration.lifetime

  context.logs.debug('Issue OTP', { authority, username, identity, lifetime })

  // the username is tied to the identity once `confirm` is given the code, not before
  await context.stash.set(key, identity ?? SIGN_IN, 'EX', lifetime)

  return { code }
}

interface Input {
  authority: string
  username: string
  identity?: string
  lifetime?: number
}

interface Output {
  code: string
}
