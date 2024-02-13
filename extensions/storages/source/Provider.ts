import { type Readable } from 'node:stream'
import * as assert from 'node:assert'

export interface ProviderSecrets {
  secrets?: Record<string, string>
}

export interface ProviderSecret {
  readonly name: string
  readonly optional?: boolean
}

export abstract class Provider<Options = void> {
  public static readonly SECRETS: readonly ProviderSecret[] = []

  public constructor (props: Options & ProviderSecrets) {
    for (const { name, optional = false } of new.target.SECRETS)
      assert.ok(optional || props.secrets?.[name] !== undefined, `Missing secret '${name}'`)
  }

  public abstract get (path: string): Promise<Readable | null>
  public abstract put (path: string, filename: string, stream: Readable): Promise<void>
  public abstract delete (path: string): Promise<void>
  public abstract move (from: string, to: string): Promise<void>
}

export interface ProviderConstructor {
  readonly SECRETS: readonly ProviderSecret[]
  prototype: Provider
  new(props: any): Provider
}
