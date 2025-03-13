import type { Context } from './lib'

export async function effect (input: Input, context: Context): Promise<Output> {
  const { authority, username } = input
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const key = `${authority}:${username}:${code}`

  context.logs.debug('Issue OTP', { authority, username, code })

  await context.stash.set(key, 1, 'EX', context.configuration.lifetime)

  return { code }
}

interface Input {
  authority: string
  username: string
}

interface Output {
  code: string
}
