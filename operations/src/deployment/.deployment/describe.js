'use strict'

const desc = require('./.describe')
const { addVariables } = require('./.describe/variables')
const { addMounts } = require('./.describe/mounts')
const { resources } = require('./.describe/resources')

const describe = (context, compositions, dependency, image) => {
  const { services } = dependency

  dependency.variables.global ??= []

  dependency.variables.global.unshift(
    {
      name: 'TOA_CONTEXT',
      value: context.name
    }, {
      name: 'TOA_ENV',
      value: context.environment
    }
  )

  const atomicity = context.atomicity

  if (atomicity?.redis !== undefined) {
    const addresses = Array.isArray(atomicity.redis) ? atomicity.redis : [atomicity.redis]

    // a lock is taken on `floor(n / 2) + 1` of them, so an even number tolerates no more
    // losses than the odd number below it, and two tolerate fewer than one does
    if (addresses.length % 2 === 0)
      throw new Error(`'atomicity.redis' takes an odd number of addresses, ` +
        `${addresses.length} given`)

    dependency.variables.global.push({
      name: 'TOA_ATOMICITY_REDIS',
      value: addresses.join(' ')
    })
  }

  if (atomicity?.interval !== undefined)
    dependency.variables.global.push({
      name: 'TOA_ATOMICITY_INTERVAL',
      value: String(atomicity.interval)
    })

  const outbox = context.outbox

  if (outbox?.interval !== undefined)
    dependency.variables.global.push({
      name: 'TOA_OUTBOX_INTERVAL',
      value: String(outbox.interval)
    })

  if (outbox?.batch !== undefined)
    dependency.variables.global.push({
      name: 'TOA_OUTBOX_BATCH',
      value: String(outbox.batch)
    })

  if (outbox?.retention !== undefined)
    dependency.variables.global.push({
      name: 'TOA_OUTBOX_RETENTION',
      value: String(outbox.retention)
    })

  const credentials = context.registry?.credentials

  if (image !== undefined) {
    const mono = unit(context, dependency)

    mono.image = image.reference

    const values = {
      compositions: [],
      components: mono.components,
      services: [],
      credentials,
      mono
    }

    resources(context, values)

    return values
  }

  const components = desc.components(compositions)

  desc.compositions(compositions, dependency)
  desc.services(services, dependency.variables, dependency.probe, context.ingress)

  const values = {
    compositions,
    components,
    services,
    credentials
  }

  resources(context, values)

  return values
}

function unit (context, dependency) {
  const components = (context.components ?? []).map((component) => component.locator.label)

  const variables = dependency.variables ?? {}
  const mounts = dependency.mounts ?? {}

  const mono = {
    replicas: context.mono?.replicas,
    resources: context.mono?.resources,
    components,
    variables: []
  }

  if (context.ingress !== undefined)
    mono.ingress = Object.assign({}, context.ingress)

  addVariables(mono, variables, Object.keys(variables))
  addMounts(mono, dependency.mounts, Object.keys(mounts))

  for (const service of dependency.services ?? []) {
    if (service.variables !== undefined)
      for (const variable of service.variables)
        if (!mono.variables.some((item) => item.name === variable.name))
          mono.variables.push(variable)

    // every declared port is bound by the single mono process, none is primary
    if (service.port !== undefined)
      (mono.backends ??= []).push({ port: service.port, path: service.ingress?.path ?? '/' })

    if (service.ingress !== undefined) {
      const { path, hosts, ...ingress } = service.ingress

      mono.ingress = Object.assign(mono.ingress ?? {}, ingress)

      // one Ingress serves every path, so its hosts are the union, not the last word
      if (hosts !== undefined)
        mono.ingress.hosts = [...new Set([...(mono.ingress.hosts ?? []), ...hosts])]
    }

    if (service.probe !== undefined && service.probe !== false)
      mono.probe = service.probe
  }

  if (mono.probe === undefined && dependency.probe !== undefined && dependency.probe !== false)
    mono.probe = dependency.probe

  // the more specific prefix must come first, whatever the controller's tie-break
  mono.backends?.sort((a, b) => b.path.length - a.path.length)

  return mono
}

exports.describe = describe
