import { join } from 'node:path'
import { tmpdir } from 'node:os'
import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import fse from 'fs-extra'
import dotenv from 'dotenv'
import { initScript } from './s3.init';

const envPath = join(__dirname, '.env');

if (fse.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const suites: Suite[] = [
  {
    run: true,
    ref: `file:///${join(tmpdir(), 'toa-storages-file')}`,
  },
  {
    run: true,
    ref: 'tmp:///toa-storages-temp',
  },
  {
    run: process.env.S3_LOCALSTACK === 'true',
    ref: 's3://us-east-1/testbucket?endpoint=http://s3.localhost.localstack.cloud:4566',
    secrets: {
      ACCESS_KEY: process.env.S3_ACCESS_KEY ?? '',
      SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY ?? ''
    },
    init: initScript,
  },
  // add more providers here, use `run` as a condition to run the test
  // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
]

function map (suite: Suite): Case {
  const url = new URL(suite.ref)

  return [url.protocol, url, suite.secrets ?? {}]
}

export const cases = suites.filter(({ run }) => run).map(map)

export const init = async (url: URL) => {
  const suite = suites.find((suite) => suite.ref === url.href)
  if (suite !== null && suite?.init) {
    await suite?.init(url, suite.secrets)
  }
}

export function rnd (): string{
  return Math.random().toString(36).slice(2)
}

export async function open (rel: string): Promise<Readable>{
  const path = join(__dirname, rel)

  return createReadStream(path)
}

export async function read (rel: string): Promise<Buffer>{
  const path = join(__dirname, rel)

  return fs.readFile(path)
}

interface Suite{
  run: boolean
  ref: string
  secrets?: Record<string, string>,
  init?: (url: URL, secrets?: Record<string, string>) => Promise<void>
}

type Case = [string, URL, Record<string, string>]
