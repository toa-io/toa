import * as assert from 'node:assert'
import type { Metadata, Stream } from './Entry'
import type { Readable } from 'node:stream'
import type { Maybe } from '@toa.io/types'
import type { Secret, Secrets } from './Secrets'

export abstract class Provider<Options = unknown> {
  public static readonly SECRETS?: readonly Secret[]
  public readonly root?: string
  public readonly options: Options

  protected constructor (options: Options, secrets?: Secrets) {
    this.options = options
    
    new.target.SECRETS?.forEach(({ name, optional }) =>
      assert.ok(optional === true || secrets?.[name] !== undefined, `Missing secret '${name}'`))
  }

  public abstract get (path: string, options?: unknown): Promise<Maybe<Stream>>

  public abstract head (path: string): Promise<Maybe<Metadata>>

  public abstract put (path: string, stream: Readable): Promise<void>

  public abstract commit (path: string, metadata: Metadata): Promise<void>

  public abstract delete (path: string): Promise<void>

  public abstract move (from: string, to: string): Promise<Maybe<void>>
}

export interface Constructor<Options = any> {
  SECRETS?: readonly Secret[]

  new (options: Options, secrets?: Secrets): Provider<Options>
}
