import * as assert from 'node:assert'
import type { Metadata, MetadataStream } from './Entry'
import type { Readable } from 'node:stream'
import type { Maybe } from '@toa.io/types'
import type { Secret, Secrets } from './Secrets'

export abstract class Provider<Options = void> {
  public static readonly SECRETS?: readonly Secret[]
  public readonly root?: string

  protected constructor (_: Options, secrets?: Secrets) {
    new.target.SECRETS?.forEach(({ name, optional }) =>
      assert.ok(optional === true || secrets?.[name] !== undefined, `Missing secret '${name}'`))
  }

  public abstract get (path: string): Promise<Maybe<MetadataStream>>

  public abstract head (path: string): Promise<Maybe<Metadata>>

  public abstract put (path: string, stream: Readable): Promise<void>

  public abstract commit (path: string, metadata: Metadata): Promise<void>

  public abstract delete (path: string): Promise<void>

  public abstract move (from: string, to: string): Promise<Maybe<void>>
}

export interface Constructor {
  SECRETS?: readonly Secret[]

  new (options: any, secrets?: Secrets): Provider
}
