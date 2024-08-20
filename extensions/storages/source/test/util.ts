import { join } from 'node:path'
import dotenv from 'dotenv'
import type { Secrets } from '../Secrets'
import type {
  providers,
  S3Options,
  CloudinaryOptions,
  FileSystemOptions,
  TemporaryOptions
} from '../providers'

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
  },
  {
    run: process.env.RUN_CLOUDINARY === '1',
    provider: 'cloudinary',
    options: {
      environment: 'dl5z4zgth',
      type: 'image',
      prefix: 'toa-dev',
      transformations: [
        {
          extension: '(?<width>\\d*)x(?<height>\\d*)(z(?<zoom>\\d*))?',
          transformation: {
            width: '<width>',
            height: '<height>',
            zoom: '<zoom>',
            crop: 'thumb',
            gravity: 'face'
          },
          optional: true
        },
        {
          extension: '\\[(?<width>\\d*)x(?<height>\\d*)\\](z(?<zoom>\\d+))?',
          transformation: {
            width: '<width>',
            height: '<height>',
            zoom: '<zoom>',
            crop: 'fit'
          },
          optional: true
        },
        {
          extension: '(?<format>jpeg|webp)',
          transformation: {
            fetch_format: '<format>'
          },
          optional: true
        }
      ]
    },
    secrets: {
      API_KEY: process.env.CLOUDINARY_API_KEY ?? '',
      API_SECRET: process.env.CLOUDINARY_API_SECRET ?? ''
    }
  }
  // add more providers here, use `run` as a condition to run the test
  // e.g.: `run: process.env.ACCESS_KEY_ID !== undefined`
] satisfies Suite[]

export interface Suite {
  run: boolean
  provider: keyof typeof providers
  options?: S3Options | CloudinaryOptions | FileSystemOptions | TemporaryOptions
  secrets?: Secrets
}
