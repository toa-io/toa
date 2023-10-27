import { type Readable } from 'node:stream'
import { join } from 'node:path/posix'
import { Upload } from '@aws-sdk/lib-storage'
import dotenv from 'dotenv'
import fse from 'fs-extra'
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  type S3ClientConfigType
} from '@aws-sdk/client-s3'
import { type Provider } from '../Provider'

if (fse.existsSync(join(__dirname, '.env')))
  dotenv.config({ path: join(__dirname, '.env') })

const {
  S3_ACCESS_KEY = '',
  S3_SECRET_ACCESS_KEY = ''
} = process.env

export class S3 implements Provider {
  protected readonly bucket: string
  protected readonly client: S3Client

  public constructor (url: URL) {
    const pathSegments = url.pathname.split('/').filter((segment) => segment !== '')

    if (pathSegments.length === 0) throw new Error('S3 URL must contain at least two segments')

    const s3Config: S3ClientConfigType = {
      credentials: {
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_ACCESS_KEY
      }
    }

    if (pathSegments.length === 1) {
      s3Config.region = url.host
      this.bucket = pathSegments[0]
    } else {
      s3Config.region = pathSegments[0]
      s3Config.endpoint = `http://${url.host}` // ???
      this.bucket = pathSegments[1]
    }

    this.client = new S3Client(s3Config)
  }

  public async get (key: string): Promise<Readable | null> {
    try {
      const fileResponse = await this.client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: key
      }))

      return fileResponse.Body as Readable
    } catch (err: any) {
      if (err?.Code === 'NoSuchKey') return null
      else throw err
    }
  }

  public async put (path: string, filename: string, stream: Readable): Promise<void> {
    const key = join(path, filename)

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

    await new Promise((resolve) => setTimeout(resolve, 500))

    await this.client.send(new CopyObjectCommand({
      Bucket: this.bucket,
      Key: keyTo,
      CopySource: keyFrom
    }))

    await this.delete(from)
  }
}
