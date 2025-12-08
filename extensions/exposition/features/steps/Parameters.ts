import { join } from 'node:path'
import * as dotenv from 'dotenv'
import { setDefaultTimeout } from '@cucumber/cucumber'
import { console } from 'openspan'
import { encode } from '@toa.io/generic'

dotenv.config({ path: join(__dirname, '.env') })

export class Parameters {
  public readonly origin: string

  public constructor () {
    this.origin = 'http://127.0.0.1:8000'
  }
}

setDefaultTimeout(60 * 1000)

console.configure({ format: 'terminal' })

process.env.TOA_DEV = '1'

process.env.TOA_STORAGES = encode({
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
        extension: 'icon',
        transformation: [{
          width: 48,
          height: 48,
          crop: 'fill'
        }, {
          border: '10px_solid_white'
        }],
        optional: true
      },
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
  cloudinary_video: {
    provider: 'cloudinary',
    environment: process.env.CLOUDINARY_ENVIRONMENT ?? 'nope',
    type: 'video',
    prefix: 'toa-dev',
    eager: [
      {
        width: 200,
        height: 200,
        crop: 'fill'
      }
    ],
    transformations: [
      {
        extension: '200x200',
        transformation: {
          width: 200,
          height: 200,
          crop: 'fill'
        },
        optional: true
      },
      {
        extension: '(?<format>mp4|gif)',
        transformation: {
          quality: 'auto',
          fetch_format: '<format>'
        },
        optional: true
      }
    ]
  }
})
