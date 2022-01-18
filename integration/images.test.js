'use strict'

const { join } = require('node:path')
const boot = require('@toa.io/boot')
const { context: load } = require('@toa.io/package')
const { docker } = require('./framework')

const path = join(__dirname, './context')

let images
let context

beforeAll(async () => {
  context = await load(path)
  await docker.clear(context.registry)
})

afterAll(async () => {
  await docker.clear(context.registry)
})

beforeEach(async () => {
  images = await boot.images(path)
})

it('should push', async () => {
  await images.push()

  const list = await docker.list()

  context.manifests.forEach((manifest) => {
    const repository = context.registry + '/' + manifest.domain + '-' + manifest.name
    const image = list.find((image) => image.repository === repository && image.tag === manifest.version)

    expect(image).toBeDefined()
  })
})
