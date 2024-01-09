import { join } from 'node:path'
import fs from 'node:fs/promises'
import { createReadStream, type ReadStream } from 'node:fs'
import dotenv from 'dotenv'

dotenv.config({ path: join(__dirname, '.env') })

const suites: Suite[] = [
  {
    run: true,
    ref: 'tmp:///toa-storages-temp'
  },
  {
    run: process.env.RUN_S3 === '1',
    ref: 'https://s3.localhost.localstack.cloud:4566/test-bucket',
    secrets: {
      ACCESS_KEY_ID: 'developer',
      SECRET_ACCESS_KEY: 'secret'
    }
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

interface Suite {
  run: boolean
  ref: string
  secrets?: Record<string, string>
  init?: SuiteInit
}

type SuiteInit = (url: URL, secrets: Record<string, string>) => Promise<void> | void
type Case = [string, URL, Record<string, string>, SuiteInit?]
