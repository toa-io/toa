import { V3 } from 'paseto'
import { type Claim, type Context, type EncryptInput } from './types'

export async function effect (input: EncryptInput, context: Context): Promise<string> {
  const lifetime = input.lifetime ?? context.configuration.lifetime

  const exp = lifetime === 0
    ? undefined
    : new Date(Date.now() + lifetime).toISOString()

  const payload: Partial<Claim> = { identity: input.identity, exp }

  return await V3.encrypt(payload, context.configuration.key0)
}
