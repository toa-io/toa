import { tmpdir } from 'node:os'
import { join } from 'node:path'
import assert from 'node:assert'
import { pathToFileURL } from 'node:url'

import { FileSystem } from './FileSystem'

export class Temporary extends FileSystem {
  public constructor (url: URL) {
    assert.equal(url.protocol, 'tmp:', `Invalid Temporary URL: ${url.toString()}`)
    super(pathToFileURL(join(tmpdir(), url.pathname)))
  }
}
