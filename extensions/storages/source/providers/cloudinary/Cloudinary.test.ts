import { resolve } from 'node:path'
import { createReadStream } from 'node:fs'
import { suites } from '../../test/util'
import { Cloudinary } from './Cloudinary'
import type { CloudinaryOptions, CloudinarySecrets } from './Cloudinary'

const lenna = resolve(__dirname, '../../test/lenna.png')
const suite = suites[2] as CloudinarySuite
const cloudinary = new Cloudinary(suite.options, suite.secrets)
const test = (suite.run) ? it : it.skip

test('run me once', async () => {
  const stream = createReadStream(lenna)

  await cloudinary.put('/resize/lenna', { stream, metadata: { type: 'image/png', size: 0, created: Date.now() } })

  const output = await cloudinary.get('/resize/lenna')

  expect(output).not.toBeNull()
})

test('should be', async () => {
  expect(cloudinary).toBeInstanceOf(Cloudinary)
})

test.each(['48x48', 'x60', '[128x128]z50'])('should resize to %s', async (transform) => {
  const stream = await cloudinary.get(`/resize/lenna.${transform}.jpeg`)

  expect(stream).not.toBeNull()
})

interface CloudinarySuite {
  run: boolean
  options: CloudinaryOptions
  secrets: CloudinarySecrets
}

jest.setTimeout(10_000)
