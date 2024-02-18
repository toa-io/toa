import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert'
import { FileSystem } from './FileSystem'

export interface TemporaryOptions {
  directory?: string // this should not be optional
}

export class Temporary extends FileSystem {
  public constructor (props: TemporaryOptions) {
    assert.ok(props.directory !== undefined,
      'Temporary Storage provider requires `directory` option')

    const path = join(tmpdir(), props.directory)

    super({ path })
  }
}
