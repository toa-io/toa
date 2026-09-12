import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import * as dotenv from 'dotenv'
import { setDefaultTimeout } from '@cucumber/cucumber'
import { environment as variables } from '@toa.io/generic'

dotenv.config({ path: join(import.meta.dirname, '.env') })

/**
 * Not `PORT` and `PROBE`, which a deployment serves the gateway on: an application built on
 * Toa is served on this machine too, and its own gateway holds those. See CONTRIBUTING.md.
 */
export const PORT = 31000
export const PROBE = 31004

export class Parameters {
  public readonly origin: string

  public constructor() {
    this.origin = `http://127.0.0.1:${PORT}`
  }
}

setDefaultTimeout(60 * 1000)

variables.set('TOA_DEV', '1')

// a reply is checked against what the operation declares, so the suite runs Toa under the
// contract it asks applications to keep
if (!variables.has('TOA_ENV')) variables.set('TOA_ENV', 'local')

// the gateway answers for itself, as it does in a deployment: telemetry's probe tracks the
// nested composition, which connects before route discovery settles
if (!variables.has('TOA_TELEMETRY_READY'))
  variables.set('TOA_TELEMETRY_READY', JSON.stringify(false))

// export traces to the local Tempo (`docker compose up tempo grafana`),
// unavailability of the endpoint is harmless
if (!variables.has('TOA_TELEMETRY_TRACES'))
  variables.set(
    'TOA_TELEMETRY_TRACES',
    JSON.stringify({
      exporters: {
        console: null,
        otlp: { endpoint: 'http://localhost:31061' }
      }
    })
  )

// and metrics to the local Prometheus, whose absence is harmless the same way
if (!variables.has('TOA_TELEMETRY_METRICS'))
  variables.set(
    'TOA_TELEMETRY_METRICS',
    JSON.stringify({
      // shorter than the default, so a suite that runs for minutes posts more than once
      interval: 5000,
      exporters: { otlp: { endpoint: 'http://localhost:31070/api/v1/otlp' } }
    })
  )

/*
 * The page the gateway serves at `/.discovery/`, pointed at a fixture: the scenarios are
 * about the server, not the page, and none of them should need a UI build. Set here rather
 * than in a step because the gateway is not rebuilt between scenarios that share its
 * signature, so one flipping this would silently read whatever the last one left.
 */
process.env.__TESTING_EXPOSITION_DISCOVERY_ROOT = join(import.meta.dirname, '..', 'site')

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
        transformation: [
          {
            width: 48,
            height: 48,
            crop: 'fill'
          },
          {
            border: '10px_solid_white'
          }
        ],
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

variables.set(
  'TOA_STORAGES',
  JSON.stringify({
    octets: {
      provider: 'tmp',
      directory: randomUUID()
    },
    ...(environment === undefined ? {} : CLOUDINARY)
  })
)
