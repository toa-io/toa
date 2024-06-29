'use strict'

const desc = require('./.describe')

const describe = (context, compositions, dependency) => {
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

  const components = desc.components(compositions)
  const credentials = context.registry?.credentials

  desc.compositions(compositions, dependency)
  desc.services(services, dependency.variables)

  return {
    compositions,
    components,
    services,
    credentials
  }
}

exports.describe = describe
