import { join } from 'node:path'
import { Readable } from 'node:stream'
import { v2 as cloudinary } from 'cloudinary'
import { Provider } from '../Provider'
import type { ReadableStream } from 'node:stream/web'
import type { ConfigOptions as CloudinaryConfig } from 'cloudinary'
import type { ProviderSecret, ProviderSecrets } from '../Provider'

export class Cloudinary extends Provider<CloudinaryOptions> {
  public static override readonly SECRETS: readonly ProviderSecret[] = [
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

  public async get (path: string): Promise<Readable | null> {
    const id = join(this.prefix, path)
    const resource = await this.resource(id)

    const url = resource === null
      ? this.cloudinary().url(id, { resource_type: 'raw', version: 2 })
      : resource.url

    const response = await fetch(url)

    if (!response.ok)
      return null

    return Readable.fromWeb(response.body as ReadableStream)
  }

  public async put (path: string, id: string, stream: Readable): Promise<void> {
    const folder = join(this.prefix, path)

    await new Promise((resolve, reject) => {
      stream.pipe(this.cloudinary().uploader.upload_stream({ public_id: id, folder, resource_type: 'auto', overwrite: true },
        (error, result) => {
          if (error !== undefined) reject(error)
          else resolve(result)
        }))

      stream.on('error', resolve)
    })
  }

  public async delete (path: string): Promise<void> {
    const id = join(this.prefix, path)
    const type = this.resourceType(id)

    const ok = await this.cloudinary().uploader.destroy(id, { resource_type: type, invalidate: true })

    if (ok.result === 'not found') {
      await this.cloudinary().api.delete_resources_by_prefix(id)
      await this.cloudinary().api.delete_folder(id).catch(() => undefined)
    }
  }

  public async move (from: string, to: string): Promise<void> {
    const source = join(this.prefix, from)
    const target = join(this.prefix, to)
    const resource = await this.resource(source)

    await this.cloudinary().uploader.rename(source, target,
      {
        overwrite: true,
        resource_type: resource?.resource_type
      })
  }

  private cloudinary (): typeof cloudinary {
    cloudinary.config(this.config)

    return cloudinary
  }

  private resourceType (path: string): string {
    return path.includes('.meta') ? 'raw' : this.type
  }

  private async resource (id: string): Promise<CloudinaryResource | null> {
    const type = this.resourceType(id)

    return await this.cloudinary().api
      .resource(id, { resource_type: type })
      .catch(async (exception) => {
        if (exception.error.http_code === 404)
          return null
        else
          throw exception
      })
  }
}

export interface CloudinaryOptions {
  environment: string
  type: StorageType
  prefix?: string
}

type StorageType = 'image' | 'video'

interface CloudinaryResource {
  url: string
  resource_type: string
  display_name: string
}

type CloudinarySecrets = ProviderSecrets<'API_KEY' | 'API_SECRET'>
