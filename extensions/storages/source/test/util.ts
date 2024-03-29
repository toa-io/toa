import { join } from 'node:path'
import dotenv from 'dotenv'
import type { ProviderSecrets } from '../Provider'
import type { providers } from '../providers'
import type { FileSystemOptions } from '../providers/FileSystem'
import type { S3Options } from '../providers/S3'
import type { TemporaryOptions } from '../providers/Temporary'

dotenv.config({ path: join(__dirname, '.env') })

export const suites = [
  {
    run: true,
    provider: 'tmp',
    options: {
      directory: 'toa-storages-temp'
    }
  },
  {
    run: true,
    provider: 'mem'
  },
  {
    run: process.env.RUN_S3 === '1',
    provider: 's3',
    options: {
      endpoint: 'http://localhost:4566',
      region: 'us-west-1',
      bucket: 'test-bucket'
    },
    secrets: {
      ACCESS_KEY_ID: 'developer',
      SECRET_ACCESS_KEY: 'secret'
    }
  }
  // add more providers here, use `run` as a condition to run the test
  // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
] satisfies Suite[]

interface Suite {
  run: boolean
  provider: keyof typeof providers
  options?: FileSystemOptions | S3Options | TemporaryOptions
  secrets?: ProviderSecrets
}
