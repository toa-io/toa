'use strict'

const { join } = require('node:path')

const boot = require('@toa.io/boot')
const { yaml } = require('@toa.io/gears')

const fixtures = require('./deployment.template.fixtures')

const source = join(__dirname, './context')

/** @type {toa.operations.deployment.Operator} */
let operator
/** @type {Object[]} */
let resources

/**
 * @param {string} kind
 * @param {string} name
 * @returns {toa.gears.Object}
 */
const find = (kind, name) => {
  return resources.find((resource) => resource.kind === kind && resource.metadata.name === name)
}

beforeAll(async () => {
  operator = await boot.deployment(source)

  const output = await operator.template()
  resources = yaml.split(output)

  // resources = await yaml.all(join(__dirname, 'deployment.template.temp.yaml'))
})

it('should define', () => {
  expect(resources).toBeDefined()
})

describe('compositions', () => {
  it('should define deployments', () => {
    for (const composition of fixtures.compositions) {
      const name = 'composition-' + composition.name
      const deployment = find('Deployment', name)

      expect(deployment).toBeDefined()

      expect(deployment.spec.replicas).toStrictEqual(2)
      expect(deployment.spec.selector.matchLabels['toa.io/composition']).toStrictEqual(composition.name)

      const labels = deployment.spec.template.metadata.labels

      expect(labels['toa.io/composition']).toStrictEqual(composition.name)

      for (const component of composition.components) {
        expect(labels[component]).toStrictEqual('1')
      }

      const container = deployment.spec.template.spec.containers[0]

      expect(container.name).toStrictEqual(composition.name)
      expect(container.image).toMatch(new RegExp(`/${fixtures.scope}/composition-${composition.name}:[a-z\\d]+$`))
    }
  })
})

describe('components', () => {
  it('should define services', () => {
    for (const component of fixtures.components) {
      const service = find('Service', component)

      expect(service).toBeDefined()
      expect(service.spec.selector[component]).toStrictEqual('1')
    }
  })
})

describe('services', () => {
  it('should define deployments', () => {
    for (const service of fixtures.services) {
      const name = 'service-' + service.name
      const deployment = find('Deployment', name)

      expect(deployment).toBeDefined()

      expect(deployment.spec.replicas).toStrictEqual(2)
      expect(deployment.spec.selector.matchLabels['toa.io/service']).toStrictEqual(service.name)
      expect(deployment.spec.template.metadata.labels['toa.io/service']).toStrictEqual(service.name)

      const container = deployment.spec.template.spec.containers[0]

      expect(container.name).toStrictEqual(service.name)
      expect(container.image).toMatch(new RegExp(`/${fixtures.scope}/service-${service.name}:[a-z\\d]+$`))
    }
  })

  it('should define services', () => {
    for (const instance of fixtures.services) {
      const name = 'service-' + instance.name
      const service = find('Service', name)

      expect(service).toBeDefined()
      expect(service.spec.selector['toa.io/service']).toStrictEqual('resources-gateway')

      const port = service.spec.ports[0]

      expect(port.name).toStrictEqual('port-' + instance.port)
      expect(port.port).toStrictEqual(instance.port)
      expect(port.targetPort).toStrictEqual(instance.port)
    }
  })
})
