import { type Component, type Query } from '@toa.io/core'
import { type Reply } from '@toa.io/types'
import { type Directive, type Identity } from './types'

export class Role implements Directive {
  private readonly roles: string[]
  private readonly discovery: Promise<Component>
  private remote: Component | null = null

  public constructor (roles: string | string[], discovery: Promise<Component>) {
    this.roles = typeof roles === 'string' ? [roles] : roles
    this.discovery = discovery
  }

  public async authorize (identity: Identity | null): Promise<boolean> {
    if (identity === null)
      return false

    this.remote ??= await this.discovery

    const query: Query = { criteria: `identity==${identity.id}`, limit: 1024 }
    const reply: Reply<RoleBinding[]> = await this.remote.invoke('enumerate', { query })

    if (reply.output === undefined)
      return false

    return this.match(reply.output)
  }

  private match (bindings: RoleBinding[]): boolean {
    for (const binding of bindings) {
      const index = this.roles.findIndex((expected) => compare(expected, binding.role))

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

interface RoleBinding {
  id: string
  identity: string
  role: string
}
