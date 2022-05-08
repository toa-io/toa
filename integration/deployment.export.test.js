'use strict'

const { join } = require('node:path')
const { tmpdir } = require('node:os')
const { access, rm, mkdir } = require('node:fs/promises')

const boot = require('@toa.io/boot')
const { newid, yaml } = require('@toa.io/gears')

const fixtures = require('./deployment.export.fixtures')

const remove = (path) => rm(path, { recursive: true })
const create = (path) => mkdir(path, { recursive: true })

const source = join(__dirname, './context')

let operator
let target

beforeAll(async () => {
  operator = await boot.deployment(source)
  target = await operator.export()
})

afterAll(async () => {
  await remove(target)
})

describe('directory', () => {
  it('should create temporary target directory', async () => {
    await expect(access(target)).resolves.not.toThrow()
  })

  it('should throw on non-empty target directory', async () => {
    await expect(operator.export(__dirname)).rejects.toThrow(/must be empty/)
  })

  it('should create new target directory', async () => {
    const tmp = join(tmpdir(), 'toa-integration-' + newid())
    const dir = await operator.export(tmp)

    await expect(access(dir)).resolves.not.toThrow()
    await remove(dir)
  })

  it('should use existent empty target directory', async () => {
    const tmp = join(tmpdir(), 'toa-integration-' + newid())

    await create(tmp)
    await expect(operator.export(tmp)).resolves.not.toThrow()
    await remove(tmp)
  })
})

describe('chart', () => {
  /** @type {toa.operations.deployment.Declaration} */
  let chart
  /** @type {toa.operations.deployment.Contents} */
  let values

  beforeAll(async () => {
    [chart, values] = await Promise.all([yaml(join(target, 'Chart.yaml')), yaml(join(target, 'values.yaml'))])
  })

  it('should export declaration', () => {
    const { dependencies, ...rest } = fixtures.chart

    expect(chart).toEqual(expect.objectContaining(rest))
  })

  it('should export contents', () => {
    expect(values.compositions).toEqual(fixtures.values.compositions)
    expect(values.components).toEqual(fixtures.values.components)
  })

  it('should export dependency references', () => {
    expect(chart).toEqual(fixtures.chart)
    expect(values).toEqual(fixtures.values)
  })
})
