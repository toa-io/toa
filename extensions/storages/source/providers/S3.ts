import { Readable } from 'node:stream'
import { Blob } from 'node:buffer'
import { join } from 'node:path/posix'
import assert from 'node:assert'
import { Upload } from '@aws-sdk/lib-storage'
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectsCommand, paginateListObjectsV2,
  HeadObjectCommand, NotFound,
  DeleteObjectCommand,
  NoSuchKey,
  type S3ClientConfigType,
  type ObjectIdentifier
} from '@aws-sdk/client-s3'
import * as nodeNativeFetch from 'smithy-node-native-fetch'
import type { Provider } from '../Provider'
import type { ReadableStream } from 'node:stream/web'

export class S3 implements Provider {
  public static readonly SECRETS = ['ACCESS_KEY_ID', 'SECRET_ACCESS_KEY']

  protected readonly bucket: string
  protected readonly client: S3Client

  /**
   *
   * @param url - can be either s3 URL like s3://BUCKET-NAME/KEY
   * or HTTPS S3 endpoint like https://BUCKET-NAME.s3.REGION.amazonaws.com/KEY
   * @param secrets - optional credentials for S3 client. If omitted default AWS SDK
   * credential resolving chain applies (i.e. environment variables, shared credentials file,
   * EC2 metadata service, etc.)
   */
  public constructor (url: URL, secrets?: Record<typeof S3.SECRETS[number], string>) {
    const s3Config: S3ClientConfigType = {
      retryMode: 'adaptive',
      ...nodeNativeFetch
    }

    switch (url.protocol) {
      case 's3:':
        this.bucket = url.hostname
        break

      case 'https:':
      case 'http:': {
        /* eslint-disable max-len */
        /**
         * @see {@link https://github.com/aws/aws-sdk-java/blob/master/aws-java-sdk-s3/src/main/java/com/amazonaws/services/s3/AmazonS3URI.java}
         */
        const match = /^(?<bucket>.+\.)?s3[.-](?<region>[a-z0-9-]+)\./i.exec(url.hostname)

        assert.ok(match !== null, `Invalid S3 URI: ${url.toString()}`)

        s3Config.endpoint = url.origin
        s3Config.region = match.groups?.region?.toLowerCase()

        if (typeof match.groups?.bucket === 'string')
          this.bucket = match.groups.bucket.replace(/\.$/, '')
        else {
          // https://s3.amazonaws.com/bucket
          // https://s3.amazonaws.com/bucket/
          // https://s3.amazonaws.com/bucket/key
          const bucket = url.pathname.split('/')[1]

          assert.ok(typeof bucket === 'string', `Unable to get S3 bucket name from URL: ${url.toString()}`)

          this.bucket = bucket
        }
      }

        break

      default:
        throw new Error(`Unsupported protocol: ${url.protocol}`)
    }

    if (typeof secrets?.ACCESS_KEY_ID === 'string')
      s3Config.credentials = {
        accessKeyId: secrets.ACCESS_KEY_ID,
        secretAccessKey: secrets.SECRET_ACCESS_KEY
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

      if (fileResponse.Body === undefined)
        return null // should never happen

      if (fileResponse.Body instanceof Readable)
        return fileResponse.Body

      return Readable.fromWeb((fileResponse.Body instanceof Blob
        ? fileResponse.Body.stream()
        : fileResponse.Body
      ) as ReadableStream) // types mismatch between Node 20 and aws-sdk
    } catch (err) {
      if (err instanceof NotFound || err instanceof NoSuchKey) return null
      else throw err
    }
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

    const objectsToRemove: ObjectIdentifier[] = []

    for await (const page of paginateListObjectsV2({ client }, { Bucket, Prefix: Key }))
      for (const { Key } of page.Contents ?? [])
        objectsToRemove.push({ Key })

    // Removing all objects in parallel in batches
    await Promise.all((function * () {
      while (objectsToRemove.length > 0)
        yield client.send(new DeleteObjectsCommand({
          Bucket,
          Delete: {
            Objects: objectsToRemove.splice(0, 1000 /* max batch size for DeleteObjects */)
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
}
