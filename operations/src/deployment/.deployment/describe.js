'use strict'

const desc = require('./.describe')
const { addVariables } = require('./.describe/variables')
const { addMounts } = require('./.describe/mounts')

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

  const credentials = context.registry?.credentials

  if (image !== undefined) {
    const mono = unit(context, dependency)

    mono.image = image.reference

    return {
      compositions: [],
      components: mono.components,
      services: [],
      credentials,
      mono
    }
  }

  const components = desc.components(compositions)

  desc.compositions(compositions, dependency)
  desc.services(services, dependency.variables, dependency.probe)

  return {
    compositions,
    components,
    services,
    credentials
  }
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

  addVariables(mono, variables, Object.keys(variables))
  addMounts(mono, dependency.mounts, Object.keys(mounts))

  for (const service of dependency.services ?? []) {
    if (service.variables !== undefined)
      for (const variable of service.variables)
        if (!mono.variables.some((item) => item.name === variable.name))
          mono.variables.push(variable)

    if (service.port !== undefined)
      mono.port = service.port

    if (service.ingress !== undefined)
      mono.ingress = service.ingress

    if (service.probe !== undefined && service.probe !== false)
      mono.probe = service.probe
  }

  if (mono.probe === undefined && dependency.probe !== undefined && dependency.probe !== false)
    mono.probe = dependency.probe

  return mono
}

exports.describe = describe
