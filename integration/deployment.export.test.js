'use strict'

const { join } = require('node:path')
const { tmpdir } = require('node:os')

const boot = require('@toa.io/boot')
const { newid, yaml, directory: { remove, ensure, is } } = require('@toa.io/gears')

const fixtures = require('./deployment.export.fixtures')

const source = join(__dirname, './context')

/** @type {toa.operations.deployment.Operator} */
let operator
/** @type {string} */
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
    await expect(is(target)).resolves.toEqual(true)
  })

  it('should throw on non-empty target directory', async () => {
    await expect(operator.export(__dirname)).rejects.toThrow(/must be empty/)
  })

  it('should create new target directory', async () => {
    const tmp = join(tmpdir(), 'toa-integration-' + newid())
    const dir = await operator.export(tmp)

    await expect(is(dir)).resolves.toEqual(true)
    await remove(dir)
  })

  it('should use existent empty target directory', async () => {
    const tmp = join(tmpdir(), 'toa-integration-' + newid())

    await ensure(tmp)
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
    expect(chart.dependencies).toEqual(fixtures.chart.dependencies)

    for (const name of Object.keys(fixtures.chart.dependencies)) {
      expect(values[name]).toEqual(fixtures.values[name])
    }
  })

  it('should export dependency services', () => {
    expect(values.services).toEqual(fixtures.values.services)
  })

  it('should export for a given environment', async () => {
    const environment = 'staging'

    operator = await boot.deployment(source, environment)
    target = await operator.export()
    values = /** @type {toa.operations.deployment.Contents} */ await yaml(join(target, 'values.yaml'))

    expect(values.environment).toStrictEqual(environment)
    expect(values.services[0].ingress.host).toStrictEqual('dummies.stage.toa.dev')
  })
})
