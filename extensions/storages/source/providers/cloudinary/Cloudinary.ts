import { join } from 'node:path'
import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import { console } from 'openspan'
import { Provider } from '../../Provider'
import { parse } from './parse'
import type { ReadableStream } from 'node:stream/web'
import type { ConfigOptions as CloudinaryConfig } from 'cloudinary'
import type { ProviderSecret, ProviderSecrets } from '../../Provider'

export class Cloudinary extends Provider<CloudinaryOptions> {
  public static override readonly SECRETS: readonly ProviderSecret[] = [
    { name: 'API_KEY' },
    { name: 'API_SECRET' }
  ]

  public override readonly dynamic = true

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

  public async get (path: string): Promise<Readable | null> {
    const url = this.url(path)

    if (url === null)
      return null

    const response = await fetch(url)

    console.debug('Fetched from Cloudinary', {
      ok: response.ok,
      url,
      type: response.headers.get('content-type'),
      size: response.headers.get('content-length')
    })

    // https://res.cloudinary.com/dl5z4zgth/image/upload/c_thumb,g_face,z_1/v2/toa-dev/blobs/814a0034f5549e957ee61360d87457e5?_a=BAMAGSWM0
    // https://res.cloudinary.com/dl5z4zgth/image/upload/v2/toa-dev/blobs/814a0034f5549e957ee61360d87457e5?_a=BAMAGSWM0

    if (!response.ok)
      return null

    return response.body === null ? null : Readable.fromWeb(response.body as ReadableStream)
  }

  public async put (path: string, id: string, stream: Readable): Promise<void> {
    const folder = join(this.prefix, path)

    await new Promise((resolve, reject) => {
      stream.pipe(this.cloudinary().uploader.upload_stream({ public_id: id, folder, resource_type: 'auto', overwrite: true },
        (error, result) => {
          if (error !== undefined) reject(error)
          else resolve(result)
        }))

      stream.on('error', (error: any) => {
        if (error.code === 'TYPE_MISMATCH')
          resolve(null)
        else
          reject(error)
      })
    })

    console.debug('Uploaded to Cloudinary', { path, id })
  }

  public async delete (path: string): Promise<void> {
    const id = join(this.prefix, path)
    const type = this.resourceType(id)

    const ok = await this.cloudinary().uploader.destroy(id, { resource_type: type, invalidate: true })

    if (ok.result === 'not found') {
      await this.cloudinary().api.delete_resources_by_prefix(id)
      await this.cloudinary().api.delete_folder(id).catch(() => undefined)
    }

    console.debug('Deleted from Cloudinary', { path: id })
  }

  public async move (from: string, to: string): Promise<void> {
    const source = join(this.prefix, from)
    const target = join(this.prefix, to)
    const type = this.resourceType(source)

    await this.cloudinary().uploader.rename(source, target,
      {
        overwrite: true,
        resource_type: type
      })
  }

  private url (path: string): string | null {
    const [rel, transformation] = parse(path, this.type)

    if (rel === null)
      return null

    const id = join(this.prefix, rel)
    const type = this.resourceType(id)

    return this.cloudinary().url(id, {
      resource_type: type,
      transformation,
      version: 2
    })
  }

  private resourceType (path: string): string {
    return path.includes('.meta') ? 'raw' : this.type
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

export type CloudinarySecrets = ProviderSecrets<'API_KEY' | 'API_SECRET'>
