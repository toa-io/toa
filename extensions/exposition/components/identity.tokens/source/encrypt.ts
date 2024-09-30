import { V3 } from 'paseto'
import { type Operation } from '@toa.io/types'
import { type Claims, type Context, type EncryptInput } from './types'

export class Effect implements Operation {
  private key: string = ''
  private lifetime: number = 0

  public mount (context: Context): void {
    this.key = context.configuration.key0
    this.lifetime = context.configuration.lifetime * 1000
  }

  public async execute (input: EncryptInput): Promise<string> {
    const lifetime = input.lifetime === undefined ? this.lifetime : input.lifetime * 1000

    const exp = lifetime === 0
      ? undefined
      : new Date(Date.now() + lifetime).toISOString()

    const payload: Partial<Claims> = {
      identity: input.identity,
      iss: input.authority,
      exp
    }

    return await V3.encrypt(payload, this.key)
  }
}
