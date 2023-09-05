import { type Component, type Query } from '@toa.io/core'
import { type Reply } from '@toa.io/types'
import { type Directive, type Identity } from './types'

export class Role implements Directive {
  public static remote: Component | null = null
  private readonly roles: string[]
  private readonly discovery: Promise<Component>

  public constructor (roles: string | string[], discovery: Promise<Component>) {
    this.roles = typeof roles === 'string' ? [roles] : roles
    this.discovery = discovery
  }

  public static async set (identity: Identity, discovery: Promise<Component>): Promise<void> {
    this.remote ??= await discovery

    const query: Query = { criteria: `identity==${identity.id}`, limit: 1024 }
    const reply: Reply<string[]> = await this.remote.invoke('list', { query })

    if (reply.output === undefined)
      return

    identity.roles = reply.output
  }

  public async authorize (identity: Identity | null): Promise<boolean> {
    if (identity === null)
      return false

    await Role.set(identity, this.discovery)

    if (identity.roles === undefined)
      return false

    return this.match(identity.roles)
  }

  private match (roles: string[]): boolean {
    for (const role of roles) {
      const index = this.roles.findIndex((expected) => compare(expected, role))

      if (index !== -1)
        return true
    }

    return false
  }
}

function compare (expected: string, actual: string): boolean {
  const exp = expected.split(':')
  const act = actual.split(':')

  for (let i = 0; i < act.length; i++)
    if (exp[i] !== act[i])
      return false

  return true
}
