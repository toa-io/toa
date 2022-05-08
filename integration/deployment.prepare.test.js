'use strict'

const { join } = require('node:path')
const { rm, readdir } = require('node:fs/promises')

const boot = require('@toa.io/boot')

const fixtures = require('./deployment.prepare.fixtures')

const remove = (path) => rm(path, { recursive: true })
const source = join(__dirname, './context')

let operator
let target
let entries

beforeAll(async () => {
  operator = await boot.deployment(source)
  target = await operator.prepare()
  entries = await readdir(target)
})

afterAll(async () => {
  await remove(target)
})

it('should export contexts', () => {
  const names = fixtures.compositions.map((composition) => composition.name)

  expect(entries).toEqual(expect.arrayContaining(names))
})

it('should export context contents', async () => {
  expect(fixtures.compositions.length).toBeGreaterThan(0)

  for (const composition of fixtures.compositions) {
    const entries = await readdir(join(target, composition.name))

    expect(entries).toEqual(['Dockerfile', ...composition.components])
  }
})
