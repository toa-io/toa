import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { FileSystem } from './FileSystem'

export class Temporary extends FileSystem {
  protected override readonly path: string

  public constructor (url: URL) {
    super(url)

    this.path = join(tmpdir(), url.pathname)
  }
}
