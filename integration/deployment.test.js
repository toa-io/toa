'use strict'

const fs = require('node:fs/promises')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const execa = require('execa')
const { newid, yaml } = require('@toa.io/gears')
const boot = require('@toa.io/boot')
const fixtures = require('./deployment.fixtures')

const path = join(__dirname, './context')

let deployment

beforeEach(async () => {
  deployment = await boot.deployment(path)
})

describe('export', () => {
  it('should export', async () => {
    const tmp = await deployment.export()
    const files = await fs.readdir(tmp)

    expect(files).toEqual(['Chart.yaml', 'values.yaml'])

    const chart = await yaml(join(tmp, 'Chart.yaml'))
    const values = await yaml(join(tmp, 'values.yaml'))

    expect(chart).toStrictEqual({ ...fixtures.chart, dependencies: expect.any(Array) })
    fixtures.chart.dependencies.forEach((dependency) => expect(chart.dependencies).toContainEqual(dependency))

    expect(values).toStrictEqual(fixtures.values)
  })

  it('should throw on non-empty directory', async () => {
    await expect(deployment.export(__dirname)).rejects.toThrow(/must be empty/)
  })

  it('should create new dir', async () => {
    const tmp = join(tmpdir(), 'toa-integration-' + newid())

    await expect(deployment.export(tmp)).resolves.not.toThrow()
  })

  it('should use existent empty dir', async () => {
    const tmp = join(tmpdir(), 'toa-integration-' + newid())

    await fs.mkdir(tmp, { recursive: true })
    await expect(deployment.export(tmp)).resolves.not.toThrow()
  })
})

describe('deploy', () => {
  const namespace = newid()
  let current

  beforeAll(async () => {
    const { stdout: ns } = await execa('kubectl',
      ['config', 'view', '--minify', '--output', 'jsonpath={..namespace}'])

    current = ns

    const { stdout } = await execa('kubectl', ['create', 'ns', namespace])
    expect(stdout).toBe(`namespace/${namespace} created`)

    const result = await execa('kubectl', ['config', 'set-context', '--current', '--namespace', namespace])
    expect(result.exitCode).toBe(0)
  })

  afterAll(async () => {
    await execa('kubectl', ['delete', 'ns', namespace])
    await execa('kubectl', ['config', 'set-context', '--current', '--namespace', current])
  })

  it('should (re)deploy', async () => {
    const check = async (revision) => {
      await deployment.install()

      const { stdout } = await execa('helm', ['list', '-o', 'yaml'])
      const list = yaml.parse(stdout)

      expect(list[0]).toMatchObject({
        namespace,
        name: 'dummies',
        status: 'deployed',
        revision
      })
    }

    await check('1')
    await check('2')
  })
})
