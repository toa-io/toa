import * as assert from 'node:assert'
import { Err } from 'error-value'
import type { Secret, Secrets } from './Secrets'
import type { Entry } from './Entry'

export abstract class Provider<Options = void> {
  public static readonly SECRETS?: readonly Secret[]
  public readonly root?: string

  protected constructor (_: Options, secrets?: Secrets) {
    new.target.SECRETS?.forEach(({ name, optional }) =>
      assert.ok(optional === true || secrets?.[name] !== undefined, `Missing secret '${name}'`))
  }

  public abstract get (path: string): Promise<Entry | Error>

  public abstract put (path: string, entry: Entry): Promise<void>

  public abstract delete (path: string): Promise<void>

  public abstract move (from: string, to: string): Promise<void | Error>
}

export const NOT_FOUND = new Err('NOT_FOUND')

export interface Constructor {
  SECRETS?: readonly Secret[]

  new (options: any, secrets?: Secrets): Provider
}
