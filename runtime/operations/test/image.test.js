'use strict'

const fixtures = require('./image.fixtures')
const mock = fixtures.mock

jest.mock('execa', () => mock.execa)

const { Image } = require('../src/images/image')

let image
let tag

beforeAll(() => {
  const { domain, name, version } = fixtures.manifest

  tag = `${fixtures.registry}/${domain}-${name}:${version}`
})

beforeEach(() => {
  image = new Image(fixtures.manifest, fixtures.registry)
})

it('should build', async () => {
  await image.build()

  expect(mock.execa).toHaveBeenCalledWith('docker',
    ['build', fixtures.manifest.path, '-f', fixtures.DOCKERFILE, '-t', tag])
})

it('should push', async () => {
  await image.push()

  expect(mock.execa).toHaveBeenCalledWith('docker', ['push', tag])
})

it('should pipe stdout', async () => {
  await image.build()
  await image.push()

  const build = mock.execa.mock.results[0].value
  const push = mock.execa.mock.results[1].value

  expect(build.stdout.pipe).toHaveBeenCalledWith(process.stdout)
  expect(push.stdout.pipe).toHaveBeenCalledWith(process.stdout)
})
