import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { dirname, join } from 'node:path'
import { Provider } from '../Provider'
import { ERR_NOT_FOUND } from '../errors'
import type { Readable } from 'node:stream'
import type { Maybe } from '@toa.io/types'
import type { Metadata, MetadataStream } from '../Entry'

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

  public async get (rel: string): Promise<Maybe<MetadataStream>> {
    const path = this.blob(rel)
    const metadata = await this.head(rel)

    if (metadata instanceof Error)
      return metadata

    const stream = createReadStream(path)

    return { stream, ...metadata }
  }

  public async head (rel: string): Promise<Maybe<Metadata>> {
    const path = this.meta(rel)

    return this.try(async () => {
      const contents = await fs.readFile(path, 'utf8')

      return JSON.parse(contents)
    })
  }

  public async put (rel: string, stream: Readable): Promise<void> {
    const path = this.blob(rel)
    const dir = dirname(path)

    await fs.mkdir(dir, { recursive: true })
    await fs.writeFile(path, stream)
  }

  public async commit (rel: string, metadata: Metadata): Promise<void> {
    const path = this.meta(rel)

    await fs.writeFile(path, JSON.stringify(metadata), 'utf8')
  }

  public async delete (path: string): Promise<void> {
    await Promise.all([
      fs.rm(this.blob(path), { force: true }),
      fs.rm(this.meta(path), { force: true })
    ])
  }

  public async move (from: string, to: string): Promise<Maybe<void>> {
    const bf = this.blob(from)
    const bt = this.blob(to)
    const mf = this.meta(from)
    const mt = this.meta(to)

    await fs.mkdir(dirname(bt), { recursive: true })

    return await this.try(async () => {
      await Promise.all([
        fs.rename(bf, bt),
        fs.rename(mf, mt)
      ])
    })
  }

  private blob (rel: string): string {
    return this.join(rel, '.blob')
  }

  private meta (rel: string): string {
    return this.join(rel, '.meta')
  }

  private join (rel: string, ext: string): string {
    return join(this.root, rel) + ext
  }

  private async try<T = void> (action: () => Promise<T>): Promise<Maybe<T>> {
    try {
      return await action()
    } catch (err: NodeJS.ErrnoException | any) {
      if (err?.code === 'ENOENT')
        return ERR_NOT_FOUND
      else
        throw err
    }
  }
}
