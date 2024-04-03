import { Readable } from 'node:stream'
import { Blob } from 'node:buffer'
import { join } from 'node:path/posix'
import assert from 'node:assert'
import { posix } from 'node:path'
import { Upload } from '@aws-sdk/lib-storage'
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectsCommand,
  paginateListObjectsV2,
  HeadObjectCommand,
  NotFound,
  DeleteObjectCommand,
  NoSuchKey,
  type S3ClientConfigType,
  type ObjectIdentifier
} from '@aws-sdk/client-s3'
import * as nodeNativeFetch from 'smithy-node-native-fetch'
import { Provider, type ProviderSecret, type ProviderSecrets } from '../Provider'
import type { ReadableStream } from 'node:stream/web'

export interface S3Options {
  bucket: string
  region?: string
  prefix?: string
  endpoint?: string
}

type S3Secrets = ProviderSecrets<'ACCESS_KEY_ID' | 'SECRET_ACCESS_KEY'>

export class S3 extends Provider<S3Options> {
  public static override readonly SECRETS: readonly ProviderSecret[] = [
    { name: 'ACCESS_KEY_ID', optional: true },
    { name: 'SECRET_ACCESS_KEY', optional: true }
  ]

  protected readonly bucket: string
  protected readonly client: S3Client

  public constructor (options: S3Options, secrets?: S3Secrets) {
    super(options)

    this.bucket = options.bucket

    const s3Config: S3ClientConfigType = {
      retryMode: 'adaptive',
      ...nodeNativeFetch
    }

    if (options.endpoint !== undefined) {
      s3Config.forcePathStyle = options.endpoint.startsWith('http://')
      s3Config.endpoint = options.endpoint
    }

    if (options.region !== undefined) s3Config.region = options.region

    if (typeof secrets?.ACCESS_KEY_ID === 'string') {
      assert.ok(secrets.SECRET_ACCESS_KEY !== undefined,
        'SECRET_ACCESS_KEY is required if ACCESS_KEY_ID is provided')

      s3Config.credentials = {
        accessKeyId: secrets.ACCESS_KEY_ID,
        secretAccessKey: secrets.SECRET_ACCESS_KEY
      }
    }

    this.client = new S3Client(s3Config)

    this.client.middlewareStack.add((next, _context) => async (args) => {
      if ('Key' in args.input && typeof args.input.Key === 'string')
      // removes leading slash

        args.input.Key = args.input.Key.replace(/^\//, '')

      if ('Prefix' in args.input && typeof args.input.Prefix === 'string')
      // removes leading slash and ensures finishing slash

        args.input.Prefix = args.input.Prefix.replace(/^\/|\/$/g, '') + '/'

      return next(args)
    },
    {
      step: 'initialize',
      priority: 'high',
      name: 'normalizesSlashesInPath'
    })
  }

  public async get (Key: string): Promise<Readable | null> {
    try {
      const fileResponse = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key
      }))

      if (fileResponse.Body === undefined) return null // should never happen

      if (fileResponse.Body instanceof Readable) return fileResponse.Body

      return Readable.fromWeb((fileResponse.Body instanceof Blob
        ? fileResponse.Body.stream()
        : fileResponse.Body) as ReadableStream) // types mismatch between Node 20 and aws-sdk
    } catch (err) {
      if (err instanceof NotFound || err instanceof NoSuchKey)
        return null
      else
        throw err
    }
  }

  public async list (prefix: string): Promise<string[]> {
    return (await this.listObjects(prefix))
      .map(({ Key }) => posix.basename(Key!))
  }

  public async put (path: string, filename: string, stream: Readable): Promise<void> {
    await new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: join(path, filename),
        Body: stream
      }
    }).done()
  }

  /**
   * Deletes either a single object or "directory" - all objects
   * with given prefix (prefix will be enforced to finish with `/`)
   * @param Key - key name or path prefix
   */
  public async delete (Key: string): Promise<void> {
    const { client, bucket: Bucket } = this

    // checking if given key is a single file
    if (!Key.endsWith('/'))
      try {
        // DeleteObject on S3 returns no error if object does not exist
        await client.send(new HeadObjectCommand({ Bucket, Key }))
        await client.send(new DeleteObjectCommand({ Bucket, Key }))

        return
      } catch (err) {
        assert.ok(err instanceof NotFound || err instanceof NoSuchKey, err as Error)
      }

    const objectsToRemove: ObjectIdentifier[] = await this.listObjects(Key)

    // Removing all objects in parallel in batches
    await Promise.all((function * () {
      while (objectsToRemove.length > 0)
        yield client.send(new DeleteObjectsCommand({
          Bucket,
          Delete: {
            Objects: objectsToRemove.splice(0,
              1000 /* max batch size for DeleteObjects */)
          }
        }))
    })())
  }

  public async move (from: string, keyTo: string): Promise<void> {
    await this.client.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: keyTo,
      CopySource: join(this.bucket, from)
    }))

    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: from }))
  }

  public async moveDir (from: string, to: string): Promise<void> {
    const objects: ObjectIdentifier[] = await this.listObjects(from)

    await Promise.all(objects.map(async ({ Key }) => {
      const ent = posix.basename(Key!)
      const source = posix.join(from, ent)
      const target = posix.join(to, ent)

      return this.move(source, target)
    }))
  }

  private async listObjects (Prefix: string): Promise<ObjectIdentifier[]> {
    const { client, bucket: Bucket } = this
    const objects: ObjectIdentifier[] = []

    for await (const page of paginateListObjectsV2({ client }, { Bucket, Prefix }))
      for (const { Key } of page.Contents ?? [])
        objects.push({ Key })

    return objects
  }
}
