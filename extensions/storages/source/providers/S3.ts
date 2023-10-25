import { type Readable } from 'node:stream'
import { join } from 'node:path'
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand
} from '@aws-sdk/client-s3'
import { type Provider } from '../Provider'

export class S3 implements Provider {
  protected readonly path: string
  protected readonly bucket = ''
  protected readonly client: S3Client

  public constructor (url: URL) {
    if (url.host !== '')
      throw new Error('URL must not contain host')

    this.path = url.pathname
    // have to get s3config from env
    this.client = new S3Client()
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

  public async list (path: string): Promise<string[]> {
    const prefix = join(this.path, path)
    const list = (await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix
    })))?.Contents

    if (list == null || list.length === 0) return []

    /** Add handling for long (>1000) lists, dirs and better typings */
    return list
      .filter((item) => item.Key != null)
      .map((object) => object.Key) as string[]
  }

  public async delete (path: string): Promise<void> {
    const key = join(this.path, path)

    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key
    }))
  }

  public async move (from: string, to: string): Promise<void> {
    const keyFrom = join(this.path, from)
    const keyTo = join(this.path, to)

    await this.client.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: keyTo,
      CopySource: keyFrom
    }))

    await this.delete(from)
  }
}
