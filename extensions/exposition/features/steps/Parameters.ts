import { join } from 'node:path'
import * as dotenv from 'dotenv'
import { setDefaultTimeout } from '@cucumber/cucumber'

dotenv.config({ path: join(import.meta.dirname, '.env') })

export class Parameters {
  public readonly origin: string

  public constructor () {
    this.origin = 'http://127.0.0.1:8000'
  }
}

setDefaultTimeout(60 * 1000)

process.env.TOA_DEV = '1'

// a reply is checked against what the operation declares, so the suite runs Toa under the
// contract it asks applications to keep
process.env.TOA_ENV ??= 'local'

// the gateway answers for itself, as it does in a deployment: telemetry's probe tracks the
// nested composition, which connects before route discovery settles
process.env.TOA_TELEMETRY_READY ??= JSON.stringify(false)

// export traces to the local Tempo (`docker compose up tempo grafana`),
// unavailability of the endpoint is harmless
process.env.TOA_TELEMETRY_TRACES ??= JSON.stringify({
  exporters: {
    console: null,
    otlp: { endpoint: 'http://localhost:4318' }
  }
})

const environment = process.env.CLOUDINARY_ENVIRONMENT

/**
 * A storage is built when a component's context is — for every scenario, not only for the ones
 * that reach for it — and a Cloudinary storage asks for the keys of a real account. A checkout
 * carries none, so these two are declared only where `features/steps/.env` names an environment.
 */
const CLOUDINARY = {
  cloudinary: {
    provider: 'cloudinary',
    environment,
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
    environment,
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
}

process.env.TOA_STORAGES = JSON.stringify({
  octets: {
    provider: 'tmp',
    directory: Math.random().toString(36).substring(2)
  },
  ...(environment === undefined ? {} : CLOUDINARY)
})
