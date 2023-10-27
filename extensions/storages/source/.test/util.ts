import { join } from 'node:path'
import { tmpdir } from 'node:os'
import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'
import fse from 'fs-extra'
import dotenv from 'dotenv'

if (fse.existsSync(join(__dirname, '.env'))) {
  dotenv.config({ path: join(__dirname, '.env') });
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
    run: true,
    ref: 's3://s3.localhost.localstack.cloud:4566/us-east-1/testbucket',
  },
  // add more providers here, use `run` as a condition to run the test
  // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
]

function map (suite: Suite) {
  const url = new URL(suite.ref)

  return [url.protocol, url]
}

export const cases = suites.filter(({run}) => run).map(map)

export function rnd (): string {
  return Math.random().toString(36).slice(2)
}

export async function open (rel: string): Promise<Readable> {
  const path = join(__dirname, rel)

  return createReadStream(path)
}

export async function read (rel: string): Promise<Buffer> {
  const path = join(__dirname, rel)

  return fs.readFile(path)
}

interface Suite {
  run: boolean
  ref: string
}
