import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import * as s3 from '@aws-sdk/client-s3'
import { Storage } from './Storage.ts'
import { S3 } from './providers/S3.ts'
import { Cloudinary } from './providers/Cloudinary.ts'
import { Temporary } from './providers/Temporary.ts'

const DAY = 24 * 60 * 60

/** A Space whose objects are answered as the head of one stored as a PDF, or as none. */
function space(stored: boolean): Storage {
  const provider = new S3(
    { bucket: 'files', region: 'fra1', endpoint: 'https://fra1.digitaloceanspaces.com' },
    { ACCESS_KEY_ID: 'key', SECRET_ACCESS_KEY: 'secret' }
  )

  const client = (provider as unknown as { client: s3.S3Client }).client

  client.send = (async (command: unknown) => {
    if (!(command instanceof s3.HeadObjectCommand)) throw new Error('Unexpected command')

    if (!stored) throw Object.assign(new Error('NotFound'), { name: 'NotFound' })

    return { Metadata: { value: JSON.stringify({ type: 'application/pdf' }) } }
  }) as typeof client.send

  return new Storage(provider)
}

describe('url', () => {
  it('signs where an S3 storage delivers a file, as the type it was stored as', async () => {
    const url = await space(true).url('/briefs/a1')

    assert.ok(typeof url === 'string')

    const address = new URL(url)

    assert.equal(address.host, 'files.fra1.digitaloceanspaces.com')
    assert.equal(address.pathname, '/briefs/a1')
    assert.equal(address.searchParams.get('X-Amz-Expires'), '3600')
    assert.equal(address.searchParams.get('response-content-type'), 'application/pdf')
  })

  it('signs for as long as it is asked, a week at most', async () => {
    const storage = space(true)
    const day = new URL((await storage.url('/briefs/a1', { expires: DAY })) as string)
    const month = new URL(
      (await storage.url('/briefs/a1', { expires: 30 * DAY })) as string
    )

    assert.equal(day.searchParams.get('X-Amz-Expires'), String(DAY))
    assert.equal(month.searchParams.get('X-Amz-Expires'), String(7 * DAY))
  })

  it('answers NOT_FOUND for a file an S3 storage does not have', async () => {
    const url = await space(false).url('/briefs/a1')

    assert.ok(url instanceof Error)
    assert.equal((url as Error & { code: string }).code, 'NOT_FOUND')
  })

  it('is where Cloudinary delivers a file, its variant included', async () => {
    const storage = new Storage(
      new Cloudinary(
        {
          environment: 'cloud',
          type: 'image',
          prefix: 'shop',
          transformations: [
            {
              extension: '(?<format>webp)',
              transformation: { fetch_format: '<format>' },
              optional: true
            }
          ]
        },
        { API_KEY: 'key', API_SECRET: 'secret' }
      )
    )

    const original = await storage.url('/products/kettle')
    const variant = await storage.url('/products/kettle.webp')

    assert.equal(
      original,
      'https://res.cloudinary.com/cloud/image/upload/v2/shop/products/kettle'
    )
    assert.ok(
      typeof variant === 'string' && variant.includes('/f_webp/'),
      String(variant)
    )
  })

  it('answers NO_URL where the storage serves no address of its own', async () => {
    const url = await new Storage(new Temporary({ directory: 'toa-storages-url' })).url(
      '/a'
    )

    assert.ok(url instanceof Error)
    assert.equal((url as Error & { code: string }).code, 'NO_URL')
  })
})
