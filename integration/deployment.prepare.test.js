'use strict'

const { join } = require('node:path')
const { rm, readdir } = require('node:fs/promises')

const boot = require('@toa.io/boot')

const fixtures = require('./deployment.prepare.fixtures')

const remove = (path) => rm(path, { recursive: true })
const source = join(__dirname, './context')

/** @type {toa.deployment.Operator} */
let operator
/** @type {string} */
let target
/** @type {string[]} */
let entries

beforeAll(async () => {
  operator = await boot.deployment(source)
  target = await operator.prepare()
  entries = await readdir(target)
})

afterAll(async () => {
  await remove(target)
})

it('should export compositions', () => {
  const images = fixtures.compositions.map((composition) =>
    expect.stringMatching('composition-' + composition.name + '..+'))

  expect(entries).toEqual(expect.arrayContaining(images))
})

it('should export composition contents', async () => {
  expect(fixtures.compositions.length).toBeGreaterThan(0)

  for (const composition of fixtures.compositions) {
    const dir = entries.find((entry) => entry.match(new RegExp(`^composition-${composition.name}.`)))

    expect(dir).toBeDefined()

    const contents = await readdir(join(target, dir))

    expect(contents).toEqual(['.dockerignore', 'Dockerfile', ...composition.components])
  }
})

it('should export services', async () => {
  expect(fixtures.services.length).toBeGreaterThan(0)

  for (const service of fixtures.services) {
    const dir = entries.find((entry) => entry.match(new RegExp(`^extension-${service.name}.`)))

    expect(dir).toBeDefined()

    const contents = await readdir(join(target, dir))

    expect(contents).toEqual(expect.arrayContaining(['Dockerfile']))
    expect(contents.length).toBeGreaterThan(1)
  }
})
