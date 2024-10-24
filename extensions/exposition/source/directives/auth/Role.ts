import assert from 'node:assert'
import { type Component, type Query } from '@toa.io/core'
import { type Directive, type Identity } from './types'
import type { Parameter } from '../../RTD'

export class Role implements Directive {
  public static remote: Component | null = null
  private readonly roles: string[]
  private readonly discovery: Promise<Component>
  private readonly dynamic: boolean

  public constructor (roles: string | string[], discovery: Promise<Component>) {
    this.roles = typeof roles === 'string' ? [roles] : roles
    this.discovery = discovery
    this.dynamic = this.roles.some((role) => role.includes('{'))
  }

  public static async get (identity: Identity, discovery: Promise<Component>): Promise<string[]> {
    this.remote ??= await discovery

    const query: Query = {
      criteria: `identity==${identity.id}`,
      limit: 1024
    }

    return await this.remote.invoke('list', { query })
  }

  public async authorize
  (identity: Identity | null, _: unknown, parameters: Parameter[]): Promise<boolean> {
    if (identity === null)
      return false

    identity.roles ??= await Role.get(identity, this.discovery)

    return this.match(identity.roles, parameters)
  }

  private match (roles: string[], parameters: Parameter[]): boolean {
    const required = this.dynamic ? this.substitute(parameters) : this.roles

    for (const role of roles) {
      const ok = required.some((expected) => expected === role || expected.startsWith(role + ':'))

      if (ok)
        return true
    }

    return false
  }

  private substitute (parameters: Parameter[]): string[] {
    return this.roles.map((role) => role.replaceAll(/{(\w+)}/g, (_, key) => {
      const value = parameters.find((parameter) => parameter.name === key)?.value

      assert.ok(value !== undefined,
        `Role '${role}' requires '${key}' route parameter`)

      return value
    }))
  }
}
