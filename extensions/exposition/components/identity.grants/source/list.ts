import { quote } from '@toa.io/generic'
import type { Operation } from '@toa.io/bridges.node'
import type { Context, Entity } from './lib/index.js'

/** What a user has allowed, for a screen that lets them take it back. */
export class Computation implements Operation {
  private enumerate!: Context['local']['enumerate']

  public mount (context: Context): void {
    this.enumerate = context.local.enumerate
  }

  public async execute (input: Input): Promise<Entity[]> {
    return await this.enumerate({
      query: {
        criteria: `authority==${quote(input.authority)};identity==${quote(input.identity)}`,
        limit: LIMIT
      }
    })
  }
}

const LIMIT = 256

interface Input {
  authority: string
  identity: string
}
