import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Filesystem } from './Filesystem'

export class Temporary extends Filesystem {
  protected override readonly path: string

  public constructor (url: URL) {
    super(url)

    this.path = join(tmpdir(), url.pathname)
  }
}
