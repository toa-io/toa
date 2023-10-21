import { type Readable } from 'node:stream'
import { join } from 'node:path'
import * as fs from 'fs/promises'
import * as fse from 'fs-extra'
import { type Provider } from '../Provider'

export class Filesystem implements Provider {
  protected readonly path: string

  public constructor (path: string) {
    this.path = path
  }

  public async get (rel: string): Promise<Readable | null> {
    const path = join(this.path, rel)

    try {
      const handle = await fs.open(path, 'r')

      return handle.createReadStream()
    } catch (e: any) {
      if (e?.code === 'ENOENT') return null
      else throw e
    }
  }

  public async put (rel: string, filename: string, stream: Readable): Promise<void> {
    const dir = join(this.path, rel)
    const filepath = join(dir, filename)

    await fse.ensureDir(dir)
    await fs.writeFile(filepath, stream)
  }

  public async list (rel: string): Promise<string[]> {
    const path = join(this.path, rel)

    if (!await fse.pathExists(path)) return []

    const entries = await fs.readdir(path, { withFileTypes: true })

    return entries.filter((e) => !e.isDirectory()).map((e) => e.name)
  }

  public async link (from: string, to: string): Promise<void> {
    const source = join(this.path, from)
    const link = join(this.path, to)

    await fse.ensureSymlink(source, link)
  }

  public async delete (rel: string): Promise<void> {
    const path = join(this.path, rel)

    await fse.remove(path)
  }

  public async move (from: string, to: string): Promise<void> {
    const asis = join(this.path, from)
    const tobe = join(this.path, to)

    await fs.rename(asis, tobe)
  }
}
