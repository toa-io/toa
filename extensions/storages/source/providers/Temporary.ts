import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { Filesystem } from './Filesystem'

export class Temporary extends Filesystem {
  protected override readonly path: string

  public constructor (dir: string) {
    super(dir)

    this.path = join(tmpdir(), dir)
  }
}
