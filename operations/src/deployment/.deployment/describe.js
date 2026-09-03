import * as desc from './.describe/index.js'
import { addVariables } from './.describe/variables.js'
import { addMounts } from './.describe/mounts.js'
import { resources } from './.describe/resources.js'
import { events } from './.describe/events.js'
import { fold } from './.describe/fold.js'

export const describe = (context, compositions, dependency, image) => {
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

  events(context, dependency)

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

  fold(mono, dependency.services ?? [], dependency)

  // mono is the one workload that fronts every service it runs under a single name,
  // so it inherits how they are reached as well as what they run
  for (const service of dependency.services ?? []) {
    // one Service fronts every backend, so its annotations are the union
    if (service.annotations !== undefined)
      mono.annotations = Object.assign(mono.annotations ?? {}, service.annotations)

    if (service.ingress !== undefined) {
      const { path, hosts, ...ingress } = service.ingress

      mono.ingress = Object.assign(mono.ingress ?? {}, ingress)

      // one Ingress serves every path, so its hosts are the union, not the last word
      if (hosts !== undefined)
        mono.ingress.hosts = [...new Set([...(mono.ingress.hosts ?? []), ...hosts])]
    }
  }

  return mono
}
