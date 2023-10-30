import { join } from 'node:path'
import fs from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { Readable } from 'node:stream'

const suites: Suite[] = [
  {
    run: true,
    ref: 'tmp:///toa-storages-temp',
  },
  // add more providers here, use `run` as a condition to run the test
  // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
]

function map (suite: Suite): Case{
  const url = new URL(suite.ref)

  return [url.protocol, url, suite.secrets ?? {}]
}

export const cases = suites.filter(({ run }) => run).map(map)

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
  secrets?: Record<string, string>
}

type Case = [string, URL, Record<string, string>]
