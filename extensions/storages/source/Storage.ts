import { type Readable, PassThrough } from 'node:stream'
import { posix } from 'node:path'
import crypto from 'node:crypto'
import { newid, promex } from '@toa.io/generic'
import { type Provider } from './Provider'
import { type Entry } from './Entry'

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
    const tempname = await this.send(stream)
    const id = await hash

    return await this.create(tempname, path, id)
  }

  private async send (stream: Readable): Promise<string> {
    const tempname = newid()
    const sending = new PassThrough()

    stream.pipe(sending)

    await this.provider.put(TEMP, tempname, sending)

    return tempname
  }

  private async hash (stream: Readable): Promise<string> {
    const hash = crypto.createHash('md5')
    const hashed = promex<string>()
    const hashing = new PassThrough()

    hashing.pipe(hash)
    hash.on('finish', () => hashed.resolve(hash.digest('hex')))
    stream.pipe(hashing)

    return await hashed
  }

  private async create (tempname: string, path: string, id: string): Promise<Entry> {
    await this.provider.move(posix.join(TEMP, tempname), posix.join(path, id))

    return { id } as unknown as Entry
  }
}

const TEMP = '/temp'
