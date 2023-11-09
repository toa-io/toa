import { join } from 'node:path'
import fs from 'node:fs/promises'
import { createReadStream, type ReadStream } from 'node:fs'
import { CreateBucketCommand, S3Client } from '@aws-sdk/client-s3'
import dotenv from 'dotenv'

dotenv.config({ path: join(__dirname, '.env') })

const suites: Suite[] = [
  {
    run: true,
    ref: 'tmp:///toa-storages-temp'
  },
  {
    run: process.env.RUN_S3 === '1',
    ref: 's3://us-west-1/test-bucket?endpoint=http://s3.localhost.localstack.cloud:4566',
    secrets: {
      ACCESS_KEY_ID: 'developer',
      SECRET_ACCESS_KEY: 'secret'
    },
    init: initS3
  }
  // add more providers here, use `run` as a condition to run the test
  // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
]

function map (suite: Suite): Case {
  const url = new URL(suite.ref)

  return [url.protocol, url, suite.secrets ?? {}, suite.init]
}

export const cases = suites.filter(({ run }) => run).map(map)

export function rnd (): string {
  return Math.random().toString(36).slice(2)
}

export function open (rel: string): ReadStream {
  const path = join(__dirname, rel)

  return createReadStream(path)
}

export async function read (rel: string): Promise<Buffer> {
  const path = join(__dirname, rel)

  return await fs.readFile(path)
}

async function initS3 (url: URL, secrets: Record<string, string>): Promise<void> {
  const client = new S3Client({
    credentials: {
      accessKeyId: secrets.ACCESS_KEY_ID,
      secretAccessKey: secrets.SECRET_ACCESS_KEY
    },
    region: url.host,
    endpoint: url.searchParams.get('endpoint') ?? undefined
  })

  const command = new CreateBucketCommand({ Bucket: url.pathname.substring(1) })

  await client.send(command).catch(() => undefined)
}

interface Suite {
  run: boolean
  ref: string
  secrets?: Record<string, string>
  init?: SuiteInit
}

type SuiteInit = (url: URL, secrets: Record<string, string>) => Promise<void> | void
type Case = [string, URL, Record<string, string>, SuiteInit?]
