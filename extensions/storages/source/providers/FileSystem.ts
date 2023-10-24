import { type Readable } from 'node:stream'
import { dirname, join } from 'node:path'
import { createReadStream } from 'node:fs'
import fs from 'node:fs/promises'
import fse from 'fs-extra'
import { type Provider } from '../Provider'

export class FileSystem implements Provider {
  protected readonly path: string

  public constructor (url: URL) {
    if (url.host !== '')
      throw new Error('File system URL must not contain host')

    this.path = url.pathname
  }

  public async get (path: string): Promise<Readable | null> {
    path = join(this.path, path)

    if (!await fse.exists(path))
      return null

    return createReadStream(path, F_R)
  }

  public async put (rel: string, filename: string, stream: Readable): Promise<void> {
    const dir = join(this.path, rel)
    const path = join(dir, filename)

    await fse.ensureDir(dir)
    await fs.writeFile(path, stream)
  }

  public async list (path: string): Promise<string[]> {
    path = join(this.path, path)

    if (!await fse.pathExists(path))
      return []

    const entries = await fs.readdir(path, WITH_TYPES)

    return entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
  }

  public async delete (path: string): Promise<void> {
    await fse.remove(join(this.path, path))
  }

  public async move (from: string, to: string): Promise<void> {
    from = join(this.path, from)
    to = join(this.path, to)

    await fse.ensureDir(dirname(to))
    await fs.rename(from, to)
  }
}

const F_R = { flags: 'r' }
const WITH_TYPES = { withFileTypes: true } satisfies { withFileTypes: true }
