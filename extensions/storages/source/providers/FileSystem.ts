import { type Readable } from 'node:stream'
import { dirname, join } from 'node:path'
import fs from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import assert from 'node:assert'
import { type Provider } from '../Provider'

export class FileSystem implements Provider {
  protected readonly path: string

  public constructor (url: URL) {
    assert.equal(url.protocol, 'file:', `Invalid FileSystem URL: ${url.toString()}`)

    this.path = fileURLToPath(url)
  }

  public async get (path: string): Promise<Readable | null> {
    try {
      const fd = await fs.open(join(this.path, path))

      return fd.createReadStream()
    } catch (err) {
      if ((err as NodeJS.ErrnoException)?.code === 'ENOENT') return null

      throw err
    }
  }

  public async put (rel: string, filename: string, stream: Readable): Promise<void> {
    const dir = join(this.path, rel)
    const path = join(dir, filename)

    await fs.mkdir(dirname(path), { recursive: true })
    await fs.writeFile(path, stream)
  }

  public async delete (path: string): Promise<void> {
    await fs.rm(join(this.path, path), { recursive: true, force: true })
  }

  public async move (from: string, to: string): Promise<void> {
    from = join(this.path, from)
    to = join(this.path, to)

    await fs.mkdir(dirname(to), { recursive: true })
    await fs.rename(from, to)
  }
}
