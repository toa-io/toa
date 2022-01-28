'use strict'

const fs = require('node:fs/promises')
const { join } = require('node:path')
const { tmpdir } = require('node:os')

const execa = require('execa')
const { newid, yaml } = require('@toa.io/gears')

const fixtures = require('./deployment.fixtures')
const boot = require('@toa.io/boot')

const path = join(__dirname, './context')

let deployment

beforeAll(async () => {
  deployment = await boot.deployment(path)
})

describe('export', () => {
  let root

  beforeAll(async () => {
    root = await deployment.export()
  })

  describe('directory', () => {
    it('should create temp dir', () => {
      expect(root).toBeDefined()
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

  describe('chart', () => {
    let path, chart, values

    beforeAll(async () => {
      path = join(root, 'chart')
      chart = await yaml(join(path, 'Chart.yaml'))
      values = await yaml(join(path, 'values.yaml'))
    })

    it('should export declaration', () => {
      expect(chart).toStrictEqual({ ...fixtures.chart, dependencies: expect.any(Array) })
    })

    it('should declare dependencies', () => {
      fixtures.chart.dependencies.forEach((dependency) => expect(chart.dependencies).toContainEqual(dependency))
    })

    it('should export values', () => {
      values.compositions = values.compositions.sort((a, b) => a.name > b.name ? 1 : -1)

      expect(values).toEqual(fixtures.values)
    })
  })

  describe('images', () => {
    let images

    beforeAll(async () => {
      const entries = await fs.readdir(root)

      images = entries.filter((entry) => entry !== 'chart')
    })

    it('should export image contexts', () => {
      const compositions = fixtures.values.compositions.map((composition) => composition.name)

      expect(images.sort()).toEqual(compositions.sort())
    })

    describe('context', () => {
      it('should export context', async () => {
        for (const image of images) {
          const path = join(root, image)
          const entries = await fs.readdir(path)
          const composition = fixtures.values.compositions.find((composition) => composition.name === image)

          expect(entries.sort()).toEqual(['Dockerfile', ...composition.components].sort())
        }
      })
    })
  })
})

describe('dry install', () => {
  let resources

  beforeAll(async () => {
    const { stdout } = await deployment.install({ dry: true })

    resources = stdout.split('---\n').slice(1).map(yaml.parse)
  })

  it('should declare deployments', () => {
    for (const composition of fixtures.values.compositions) {
      const deployment = resources.find(
        (resource) => resource.kind === 'Deployment' && resource.metadata.name === 'composition-' + composition.name
      )

      const labels = deployment.spec.template.metadata.labels
      expect(labels['toa.io/composition']).toEqual(composition.name)

      for (const component of composition.components) {
        expect(labels[component]).toEqual('1')
      }
    }
  })

  it('should declare services', () => {
    for (const component of fixtures.values.components) {
      const service = resources.find(
        (resource) => resource.kind === 'Service' && resource.metadata.name === component
      )

      expect(service.spec.selector[component]).toEqual('1')
    }
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
