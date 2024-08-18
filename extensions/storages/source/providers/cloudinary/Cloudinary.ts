import { basename, dirname, join } from 'node:path'
import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import { console } from 'openspan'
import { NOT_FOUND, Provider } from '../../Provider'
import { parse } from './parse'
import type { Entry, Metadata } from '../../Entry'
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

  public async get (path: string): Promise<Entry | Error> {
    const url = this.url(path)

    if (url === null)
      return NOT_FOUND

    const response = await fetch(url)

    if (!response.ok)
      return NOT_FOUND

    const stream = Readable.fromWeb(response.body as ReadableStream)

    const metadata: Metadata = {
      type: response.headers.get('content-type')!,
      size: Number.parseInt(response.headers.get('content-length') ?? '0'),
      created: Date.parse(response.headers.get('date') ?? '')
    }

    console.debug('Fetched from Cloudinary', {
      path,
      metadata
    })

    return { stream, metadata }
  }

  public async put (path: string, entry: Entry): Promise<void> {
    const id = basename(path)
    const folder = join(this.prefix, dirname(path))

    await new Promise((resolve, reject) => {
      entry.stream.pipe(this.cloudinary().uploader.upload_stream({
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

      entry.stream.on('error', (error: any) => {
        if (error.code === 'TYPE_MISMATCH')
          resolve(null)
        else
          reject(error)
      })
    })

    console.debug('Uploaded to Cloudinary', { path })
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
        return NOT_FOUND
      else
        throw error
    }
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
    }) + '-' + Math.random().toString(36).substring(7)
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
