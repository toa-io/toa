import { Readable } from 'node:stream'
import { Blob } from 'node:buffer'
import { join } from 'node:path/posix'
import assert from 'node:assert'
import { Upload } from '@aws-sdk/lib-storage'
import * as s3 from '@aws-sdk/client-s3'
import * as nodeNativeFetch from 'smithy-node-native-fetch'
import { console } from 'openspan'
import { Provider } from '../Provider'
import { ERR_NOT_FOUND } from '../errors'
import type { ReadableStream } from 'node:stream/web'
import type { Maybe } from '@toa.io/types'
import type { Stream } from '../Entry'
import type { Secret, Secrets } from '../Secrets'

export interface S3Options {
  bucket: string
  region?: string
  prefix?: string
  endpoint?: string
}

type S3Secrets = Secrets<'ACCESS_KEY_ID' | 'SECRET_ACCESS_KEY'>

export class S3 extends Provider<S3Options> {
  public static override readonly SECRETS: readonly Secret[] = [
    { name: 'ACCESS_KEY_ID', optional: true },
    { name: 'SECRET_ACCESS_KEY', optional: true }
  ]

  private readonly bucket: string
  private readonly client: s3.S3Client

  public constructor (options: S3Options, secrets?: S3Secrets) {
    super(options, secrets)

    this.bucket = options.bucket

    const s3Config: s3.S3ClientConfigType = {
      retryMode: 'adaptive',
      ...nodeNativeFetch
    }

    if (options.endpoint !== undefined) {
      s3Config.forcePathStyle = options.endpoint.startsWith('http://')
      s3Config.endpoint = options.endpoint
    }

    if (options.region !== undefined)
      s3Config.region = options.region

    if (typeof secrets?.ACCESS_KEY_ID === 'string') {
      assert.ok(secrets.SECRET_ACCESS_KEY !== undefined,
        'SECRET_ACCESS_KEY is required if ACCESS_KEY_ID is provided')

      s3Config.credentials = {
        accessKeyId: secrets.ACCESS_KEY_ID,
        secretAccessKey: secrets.SECRET_ACCESS_KEY
      }
    }

    this.client = new s3.S3Client(s3Config)

    this.client.middlewareStack.add((next, _context) => async (args) => {
      // removes leading slash
      if ('Key' in args.input && typeof args.input.Key === 'string')
        args.input.Key = args.input.Key.replace(/^\//, '')

      // removes leading slash and ensures finishing slash
      if ('Prefix' in args.input && typeof args.input.Prefix === 'string')
        args.input.Prefix = args.input.Prefix.replace(/^\/|\/$/g, '') + '/'

      return next(args)
    },
    {
      step: 'initialize',
      priority: 'high',
      name: 'normalizesSlashesInPath'
    })
  }

  public async get (Key: string): Promise<Maybe<Stream>> {
    return await this.try<Stream>(async () => {
      const entry = await this.client.send(new s3.GetObjectCommand({
        Bucket: this.bucket,
        Key
      }))

      const stream = entry.Body instanceof Readable
        ? entry.Body
        : Readable.fromWeb((entry.Body instanceof Blob
          ? entry.Body.stream()
          : entry.Body) as ReadableStream)

      if (entry.Metadata?.value === undefined)
        return ERR_NOT_FOUND

      const metadata = JSON.parse(entry.Metadata.value)

      return { stream, ...metadata }
    })
  }

  public async put (Key: string, stream: Readable): Promise<void> {
    await new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key,
        Body: stream
      }
    }).done()
  }

  public async commit (Key: string, metadata: object): Promise<void> {
    await this.client.send(new s3.CopyObjectCommand({
      Bucket: this.bucket,
      Key,
      CopySource: join(this.bucket, Key),
      Metadata: { value: JSON.stringify(metadata) },
      MetadataDirective: 'REPLACE'
    }))

    console.debug('Uploaded to S3', { bucket: this.bucket, path: Key, metadata })
  }

  public async delete (Key: string): Promise<void> {
    await this.client.send(new s3.DeleteObjectCommand({ Bucket: this.bucket, Key }))
  }

  public async move (from: string, keyTo: string): Promise<Maybe<void>> {
    return await this.try(async () => {
      await this.client.send(new s3.CopyObjectCommand({
        Bucket: this.bucket,
        Key: keyTo,
        CopySource: join(this.bucket, from)
      }))

      await this.client.send(new s3.DeleteObjectCommand({ Bucket: this.bucket, Key: from }))
    })
  }

  private async try<T = void> (action: () => Promise<T>): Promise<Maybe<T>> {
    try {
      return await action()
    } catch (err: any) {
      if (err?.name === 'NotFound' || err?.name === 'NoSuchKey')
        return ERR_NOT_FOUND
      else
        throw err
    }
  }
}
