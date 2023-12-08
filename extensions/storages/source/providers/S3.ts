import { type Readable } from 'node:stream'
import { join } from 'node:path/posix'
import { Upload } from '@aws-sdk/lib-storage'
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  type S3ClientConfigType
} from '@aws-sdk/client-s3'
import { type Provider } from '../Provider'

export class S3 implements Provider {
  public static readonly SECRETS = ['ACCESS_KEY_ID', 'SECRET_ACCESS_KEY']

  protected readonly bucket: string
  protected readonly client: S3Client

  public constructor (url: URL, secrets: Record<string, string>) {
    this.bucket = url.pathname.split('/')[1]

    if (this.bucket === undefined || this.bucket === '')
      throw new Error('S3 bucket not specified')

    const s3Config: S3ClientConfigType = {
      credentials: {
        accessKeyId: secrets.ACCESS_KEY_ID,
        secretAccessKey: secrets.SECRET_ACCESS_KEY
      },
      region: url.host,
      endpoint: url.searchParams.get('endpoint') ?? undefined
    }

    this.client = new S3Client(s3Config)
  }

  public async get (key: string): Promise<Readable | null> {
    try {
      const fileResponse = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key.slice(1)
      }))

      return fileResponse.Body as Readable
    } catch (err: any) {
      if (err?.Code === 'NoSuchKey') return null
      else throw err
    }
  }

  public async put (path: string, filename: string, stream: Readable): Promise<void> {
    const key = join(path, filename).slice(1)

    await new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream
      }
    }).done()
  }

  public async delete (key: string): Promise<void> {
    const listResponse = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: key.substring(1)
    }))

    if (listResponse.Contents !== undefined && listResponse.Contents.length > 0)
      await this.client.send(new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: listResponse.Contents.map(({ Key }) => ({ Key }))
        }
      }))
  }

  public async move (from: string, keyTo: string): Promise<void> {
    const keyFrom = join(this.bucket, from)

    await this.client.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: keyTo.slice(1),
      CopySource: keyFrom
    }))

    await this.delete(from)
  }
}
