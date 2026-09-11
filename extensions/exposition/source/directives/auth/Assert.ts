import { newid } from '@toa.io/generic'
import * as http from '../../HTTP/index.ts'
import { Incept } from './Incept.ts'
import type { Context, Directive, Identity } from './types.ts'

export class Assert implements Directive {
  private readonly disabled: boolean

  public constructor(enabled: boolean) {
    if (typeof enabled !== 'boolean')
      throw new Error('`auth:assert` directive value must be a boolean')

    this.disabled = !enabled
  }

  /** It admits nobody: it is there to require a credential, not to authorize one. */
  public admits(): boolean {
    return false
  }

  public async authorize(identity: Identity | null, context: Context): Promise<boolean> {
    if (!this.disabled) await this.incept(context, identity)

    return false
  }

  private async incept(context: Context, identity: Identity | null): Promise<void> {
    if (context.request.headers.authorization === undefined) throw new http.Unauthorized()

    if (identity === null) {
      if (!Incept.acceptable(context)) throw new http.Unauthorized()

      context.identity = await Incept.incept(context, newid())

      context.pipelines.response.push((response) => {
        response.status = 201
      })
    }
  }
}
