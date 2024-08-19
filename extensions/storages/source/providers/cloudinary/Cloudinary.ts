import { basename, dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import { console } from 'openspan'
import { Provider } from '../../Provider'
import { ERR_NOT_FOUND } from '../../errors'
import { parse } from './parse'
import type { Maybe } from '@toa.io/types'
import type { Metadata, Stream } from '../../Entry'
import type { Secret, Secrets } from '../../Secrets'
import type { ReadableStream } from 'node:stream/web'
import type { ConfigOptions as CloudinaryConfig } from 'cloudinary'

export type CloudinarySecrets = Secrets<'API_KEY' | 'API_SECRET'>

export class Cloudinary extends Provider<CloudinaryOptions> {
  public static override readonly SECRETS: readonly Secret[] = [
    { name: 'API_KEY' },
    { name: 'API_SECRET' }
  ]

  private readonly type: StorageType
  private readonly config: CloudinaryConfig
  private readonly prefix: string

  public constructor (options: CloudinaryOptions, secrets?: CloudinarySecrets) {
    super(options, secrets)

    this.type = options.type

    this.config = {
      cloud_name: options.environment,
      api_key: secrets!.API_KEY,
      api_secret: secrets!.API_SECRET
    }

    this.prefix = options.prefix ?? '/'
  }

  public async get (path: string): Promise<Maybe<Stream>> {
    const response = await this.fetch(path)

    if (response instanceof Error)
      return ERR_NOT_FOUND

    const metadata = this.metadata(response)

    return {
      stream: Readable.fromWeb(response.body as ReadableStream),
      ...metadata
    }
  }

  public async head (path: string): Promise<Maybe<Metadata>> {
    const response = await this.fetch(path, 'HEAD')

    if (response instanceof Error)
      return ERR_NOT_FOUND

    return this.metadata(response)
  }

  public async put (path: string, stream: Readable): Promise<void> {
    const id = basename(path)
    const folder = join(this.prefix, dirname(path))

    await new Promise((resolve, reject) => {
      stream.pipe(this.cloudinary().uploader.upload_stream({
        public_id: id,
        folder,
        resource_type: 'auto',
        overwrite: true,
        invalidate: true
      },
      (error, result) => {
        if (error !== undefined) reject(error)
        else resolve(result)
      }))

      stream.on('error', reject)
    })

    console.debug('Uploaded to Cloudinary', { path })
  }

  public async commit (): Promise<void> {
    // metadata is read-only
  }

  public async delete (path: string): Promise<void> {
    const id = join(this.prefix, path)

    await this.cloudinary().uploader.destroy(id,
      { resource_type: this.type, invalidate: true })

    console.debug('Deleted from Cloudinary', { path: id })
  }

  public async move (from: string, to: string): Promise<void | Error> {
    const source = join(this.prefix, from)
    const target = join(this.prefix, to)

    try {
      await this.cloudinary().uploader.rename(source, target,
        { resource_type: this.type, overwrite: true })
    } catch (error: any) {
      if (error.http_code === 404)
        return ERR_NOT_FOUND
      else
        throw error
    }
  }

  private async fetch (path: string, method = 'GET'): Promise<Maybe<Response>> {
    const url = this.url(path)

    if (url === null)
      return ERR_NOT_FOUND

    const response = await fetch(url, { method }).catch((e) => e)

    // noinspection PointlessBooleanExpressionJS,SuspiciousTypeOfGuard
    if (response instanceof Error || response.ok === false)
      return ERR_NOT_FOUND

    console.debug('Fetched from Cloudinary', {
      method,
      path,
      url
    })

    return response
  }

  private url (path: string): string | null {
    const [rel, transformation] = parse(path, this.type)

    if (rel === null)
      return null

    const id = join(this.prefix, rel)

    return this.cloudinary().url(id, {
      resource_type: this.type,
      transformation,
      version: 2
    })
  }

  private metadata (response: Response): Metadata {
    const size = response.headers.get('content-length') === null
      ? 0
      : Number.parseInt(response.headers.get('content-length')!)

    const created = response.headers.get('date') ?? new Date().toISOString()
    const etag = response.headers.get('etag')
    const checksum = etag === null ? basename(response.url) : etag.slice(1, -1)

    return {
      type: response.headers.get('content-type')!,
      size,
      checksum,
      created,
      attributes: {}
    }
  }

  private cloudinary (): typeof cloudinary {
    cloudinary.config(this.config)

    return cloudinary
  }
}

export interface CloudinaryOptions {
  environment: string
  type: StorageType
  prefix?: string
}

type StorageType = 'image' | 'video'
