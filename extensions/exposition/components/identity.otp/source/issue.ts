import type { Context } from './lib'

export async function effect (input: Input, context: Context): Promise<Output> {
  const { authority, username, identity } = input
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const key = `${authority}:${username}:${code}`
  const lifetime = input.lifetime ?? context.configuration.lifetime

  if (identity !== undefined)
    await context.local.ensure({
      entity: {
        authority,
        username,
        identity,
      }
    })
  

  context.logs.debug('Issue OTP', { authority, username, identity, code, lifetime })

  await context.stash.set(key, 1, 'EX', lifetime)
  
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
