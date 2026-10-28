import type { Metadata, Stream } from './Entry.ts'
import type { Readable } from 'node:stream'
import type { Maybe } from '@toa.io/core/types'
import type { Secret, Secrets } from './Secrets.ts'
import { ERR_NO_URL } from './errors.ts'

export abstract class Provider<Options = unknown> {
  public static readonly SECRETS?: readonly Secret[]
  public readonly root?: string
  public readonly options: Options

  protected constructor(options: Options, secrets?: Secrets) {
    this.options = options

    new.target.SECRETS?.forEach(({ name, optional }) => {
      if (optional !== true && secrets?.[name] === undefined)
        throw new Error(`Missing secret '${name}'`)
    })
  }

  public abstract get(path: string, options?: unknown): Promise<Maybe<Stream>>

  public abstract head(path: string): Promise<Maybe<Metadata>>

  public abstract put(path: string, stream: Readable): Promise<void>

  public abstract commit(path: string, metadata: Metadata): Promise<void>

  public abstract delete(path: string): Promise<void>

  public abstract move(from: string, to: string): Promise<Maybe<void>>

  /**
   * Where whoever is given it reads the file straight from the provider, with no credentials of
   * their own, for `expires` seconds where the address is signed. A provider that serves no
   * address of its own answers `NO_URL`.
   */
  public async url(_path: string, _expires: number): Promise<Maybe<string>> {
    return ERR_NO_URL
  }
}

export interface Constructor<Options = any> {
  SECRETS?: readonly Secret[]

  new (options: Options, secrets?: Secrets): Provider<Options>
}
