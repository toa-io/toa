import { type Readable, PassThrough } from 'node:stream'
import { posix } from 'node:path'
import crypto from 'node:crypto'
import { newid, promex } from '@toa.io/generic'
import { type Provider } from './Provider'
import { type Entry } from './Entry'
import { detect } from './signatures'

export class Storage {
  private readonly provider: Provider

  public constructor (provider: Provider) {
    this.provider = provider
  }

  public async get (path: string): Promise<Entry | Error> {
    return new Error('NOT_FOUND')
  }

  public async put (path: string, stream: Readable): Promise<Entry | Error> {
    const hash = this.hash(stream)
    const mime = detect(stream)
    const tempname = await this.add(stream)

    const id = await hash
    const type = await mime ?? 'application/octet-stream'

    await this.move(tempname, id)

    return await this.create(path, id, type)
  }

  private async add (stream: Readable): Promise<string> {
    const tempname = newid()
    const pass = new PassThrough()

    stream.pipe(pass)

    await this.provider.put(TEMP, tempname, pass)

    return tempname
  }

  private async hash (stream: Readable): Promise<string> {
    const hash = crypto.createHash('md5')
    const checksum = promex<string>()
    const pass = new PassThrough()

    stream.pipe(pass)
    pass.pipe(hash)
    hash.on('finish', () => checksum.resolve(hash.digest('hex')))

    return await checksum
  }

  private async move (tempname: string, id: string): Promise<void> {
    const temp = posix.join(TEMP, tempname)
    const blob = posix.join(BLOB, id)

    await this.provider.move(temp, blob)
  }

  private async create (path: string, id: string, type: string): Promise<Entry> {
    return { id, type } as unknown as Entry
  }
}

const TEMP = '/temp'
const BLOB = '/blob'
