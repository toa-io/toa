import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { dirname, join } from 'node:path'
import { NOT_FOUND, Provider } from '../Provider'
import type { Entry } from '../Entry'

export interface FileSystemOptions {
  path: string
  claim?: string
}

export class FileSystem extends Provider<FileSystemOptions> {
  public override readonly root: string

  public constructor (options: FileSystemOptions) {
    super(options)

    this.root = options.path
  }

  public async get (rel: string): Promise<Entry | Error> {
    const blob = join(this.root, rel)
    const meta = blob + '.meta'

    return this.try<Entry>(async () => {
      const contents = await fs.readFile(meta, 'utf8')
      const metadata = JSON.parse(contents)
      const stream = createReadStream(blob)

      return { stream, metadata }
    })
  }

  public async put (rel: string, entry: Entry): Promise<void> {
    const blob = join(this.root, rel)
    const meta = blob + '.meta'
    const dir = dirname(blob)

    entry.stream.on('error', () =>
      void fs.rm(blob, { force: true }).catch(() => undefined))

    await fs.mkdir(dir, { recursive: true })

    await Promise.all([
      fs.writeFile(blob, entry.stream),
      fs.writeFile(meta, JSON.stringify(entry.metadata))
    ])
  }

  public async delete (path: string): Promise<void> {
    const blob = join(this.root, path)
    const meta = blob + '.meta'

    await Promise.all([
      fs.rm(meta, { force: true }),
      fs.rm(blob, { force: true })
    ])
  }

  public async move (from: string, to: string): Promise<void | Error> {
    await fs.mkdir(dirname(to), { recursive: true })

    const bf = join(this.root, from)
    const bt = join(this.root, to)
    const mf = bf + '.meta'
    const mt = bt + '.meta'

    return await this.try(async () => {
      await Promise.all([
        fs.rename(bf, bt),
        fs.rename(mf, mt)
      ])
    })
  }

  private async try<T = void> (action: () => Promise<T>): Promise<T | Error> {
    try {
      return await action()
    } catch (err: NodeJS.ErrnoException | any) {
      if (err?.code === 'ENOENT')
        return NOT_FOUND
      else
        throw err
    }
  }
}
