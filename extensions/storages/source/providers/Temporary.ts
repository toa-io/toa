import { tmpdir } from 'node:os'
import { join } from 'node:path'

import assert from 'node:assert'
import { FileSystem } from './FileSystem'

export interface TemporaryOptions {
  directory: string
}

export class Temporary extends FileSystem {
  public constructor (props: TemporaryOptions) {
    assert.ok(props.directory, 'Temporary Storage provider requires `directory` option')

    const path = join(tmpdir(), props.directory)

    super({ path })
  }
}
