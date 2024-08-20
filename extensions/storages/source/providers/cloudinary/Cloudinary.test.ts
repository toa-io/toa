import { resolve } from 'node:path'
import { createReadStream } from 'node:fs'
import assert from 'node:assert'
import { suites } from '../../test/util'
import { Cloudinary } from './Cloudinary'
import type { CloudinaryOptions, CloudinarySecrets } from './Cloudinary'

const lenna = resolve(__dirname, '../../test/lenna.png')
const suite = suites[2] as CloudinarySuite
const cloudinary = new Cloudinary(suite.options, suite.secrets)
const test = (suite.run) ? it : it.skip

test('run me once', async () => {
  const stream = createReadStream(lenna)

  await cloudinary.put('/resize/lenna', stream)

  const output = await cloudinary.get('/resize/lenna.jpeg')

  expect(output).not.toBeNull()
})

test('should be', async () => {
  expect(cloudinary).toBeInstanceOf(Cloudinary)
})

test.each(['48x48.webp', 'x60.jpeg', '[128x128]z50.jpeg'])('should resize to %s', async (extensions) => {
  const stream = await cloudinary.get(`/resize/lenna.${extensions}`)

  assert.ok(!(stream instanceof Error))

  expect(stream.checksum).toBeDefined()
})

test.each(['48x48.unknown', 'jpeg.48x48', '48x48'])('should fail: %s', async (extensions) => {
  const error = await cloudinary.get(`/resize/lenna.${extensions}`) as any

  expect(error).toBeInstanceOf(Error)
  expect(error.code).toBe('NOT_FOUND')
})

interface CloudinarySuite {
  run: boolean
  options: CloudinaryOptions
  secrets: CloudinarySecrets
}

jest.setTimeout(10_000)
