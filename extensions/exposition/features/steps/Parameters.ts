import { join } from 'node:path'
import * as dotenv from 'dotenv'
import { setDefaultTimeout } from '@cucumber/cucumber'
import { console } from 'openspan'

dotenv.config({ path: join(__dirname, '.env') })

export class Parameters {
  public readonly origin: string

  public constructor () {
    this.origin = 'http://127.0.0.1:8000'
  }
}

setDefaultTimeout(30 * 1000)

console.configure({ format: 'terminal' })

process.env.TOA_DEV = '1'

process.env.TOA_STORAGES = JSON.stringify({
  octets: {
    provider: 'tmp',
    directory: Math.random().toString(36).substring(2)
  },
  cloudinary: {
    provider: 'cloudinary',
    environment: process.env.CLOUDINARY_ENVIRONMENT ?? 'nope',
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
  }
})
