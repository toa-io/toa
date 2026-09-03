import assert from 'node:assert'
import { newid } from '@toa.io/generic'
import * as http from '../../HTTP/index.js'
import { Incept } from './Incept.js'
import type { Context, Directive, Identity } from './types.js'

export class Assert implements Directive {
  private readonly disabled: boolean

  public constructor (enabled: boolean) {
    assert.ok(typeof enabled === 'boolean', '`auth:assert` directive value must be a boolean')

    this.disabled = !enabled
  }

  public async authorize (identity: Identity | null, context: Context): Promise<boolean> {
    if (!this.disabled)
      await this.incept(context, identity)

    return false
  }

  private async incept (context: Context, identity: Identity | null): Promise<void> {
    if (context.request.headers.authorization === undefined)
      throw new http.Unauthorized()

    if (identity === null) {
      context.identity = await Incept.incept(context, newid())

      context.pipelines.response.push((response) => {
        response.status = 201
      })
    }
  }
}
