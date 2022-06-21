// noinspection JSUnresolvedVariable

'use strict'

const { join } = require('node:path')
const { generate } = require('randomstring')

const boot = require('@toa.io/boot')
const { sample } = require('@toa.io/libraries.generic')
const { split } = require('@toa.io/libraries.yaml')

const fixtures = require('./deployment.template.fixtures')

const source = join(__dirname, './context')

let operator
let resources
let options
let environment

const find = (kind, name) => {
  return resources.find((resource) => resource.kind === kind && resource.metadata.name === name)
}

beforeAll(async () => {
  environment = generate()
  operator = await boot.deployment(source, environment)
  options = { namespace: generate() }

  const output = await operator.template(options)

  resources = split(output)
})

it('should define resources', () => {
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

  it('should set environment value', () => {
    const composition = sample(fixtures.compositions)
    const name = 'composition-' + composition.name
    const deployment = find('Deployment', name)

    const container = deployment.spec.template.spec.containers[0]

    expect(container.env).toStrictEqual(expect.arrayContaining([{ name: 'TOA_ENV', value: environment }]))
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
    expect(fixtures.services.length > 0).toStrictEqual(true)

    for (const instance of fixtures.services) {
      const name = 'service-' + instance.name
      const service = find('Service', name)

      expect(service).toBeDefined()
      expect(service.spec.selector['toa.io/service']).toStrictEqual('exposition-resources')

      const port = service.spec.ports[0]

      expect(port.name).toStrictEqual('port-' + instance.port)
      expect(port.port).toStrictEqual(instance.port)
      expect(port.targetPort).toStrictEqual(instance.port)
    }
  })

  it('should define ingress', () => {
    const services = fixtures.services.filter((service) => service.ingress !== undefined)

    expect(services.length > 0).toStrictEqual(true)

    for (const service of services) {
      const ingress = find('Ingress', service.name)

      expect(ingress).toBeDefined()

      expect(ingress.metadata.annotations).toStrictEqual(service.ingress.annotations)
      expect(ingress.spec.ingressClassName).toStrictEqual(service.ingress.class)

      const rule = ingress.spec.rules[0]
      const backend = rule.http.paths[0].backend.service

      expect(rule.host).toStrictEqual(service.ingress.host)
      expect(backend.name).toStrictEqual('service-' + service.name)
      expect(backend.port.number).toStrictEqual(service.port)
    }
  })
})

describe('proxies', () => {
  it('should define external services', () => {
    for (const proxy of fixtures.proxies) {
      const service = find('Service', proxy.name)

      expect(service).toBeDefined()
      expect(service.spec.type).toStrictEqual('ExternalName')
      expect(service.spec.externalName).toStrictEqual(proxy.target)
    }
  })
})

describe('namespace', () => {
  it('should define resources in a given namespace', async () => {
    const sa = find('ServiceAccount', 'rabbitmq')

    expect(sa.metadata.namespace).toStrictEqual(options.namespace)
  })
})
