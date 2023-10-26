import { type Readable } from 'node:stream'
import { join } from 'node:path/posix'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand
} from '@aws-sdk/client-s3'
import { type Provider } from '../Provider'

const {
  S3_REGION = '',
  S3_ENDPOINT = '',
  S3_ACCESS_KEY = '',
  S3_SECRET_ACCESS_KEY = '',
  S3_BUCKET = ''
} = process.env

export class S3 implements Provider {
  protected readonly path: string
  protected readonly bucket = S3_BUCKET
  protected readonly client: S3Client

  public constructor (url: URL) {
    if (url.host !== '')
      throw new Error('URL must not contain host')

    this.path = url.pathname
    this.client = new S3Client({
      region: S3_REGION,
      endpoint: S3_ENDPOINT,
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_ACCESS_KEY
      }
    })
  }

  public async get (path: string): Promise<Readable | null> {
    const key = join(this.path, path)

    try {
      const fileResponse = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      }))

      /**
       * Code always runs in NodeJS environment,
       * so there always will be NodeJS.Readable stream,
       * there is no need of type guard ??
       */
      return fileResponse.Body as Readable
    } catch (err: any) {
      if (err?.Code === 'NoSuchKey') return null
      else throw err
    }
  }

  public async put (path: string, filename: string, stream: Readable): Promise<void> {
    const key = join(this.path, path, filename)

    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: stream
    }))
  }

  public async delete (path: string): Promise<void> {
    const key = join(this.path, path)
    const prefix = key[0] === '/' ? key.substring(1) : key
    const listResponse = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix
    }))

    if (listResponse.Contents != null && listResponse.Contents.length > 0)
      await this.client.send(new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: listResponse.Contents.map(({ Key }) => ({ Key }))
        }
      }))
  }

  public async move (from: string, to: string): Promise<void> {
    const keyFrom = join(this.bucket, this.path, from)
    const keyTo = join(this.path, to)

    await this.client.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: keyTo,
      CopySource: keyFrom
    }))

    await this.delete(from)
  }
}
