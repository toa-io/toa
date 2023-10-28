'use strict'

const get = require('./.describe')

const describe = (context, compositions, dependency) => {
  const { services } = dependency

  dependency.variables.global ??= []
  dependency.variables.global.unshift({ name: 'TOA_ENV', value: context.environment })

  const components = get.components(compositions)
  const credentials = context.registry?.credentials

  get.compositions(compositions, dependency.variables, context.environment)
  get.services(services, dependency.variables)

  return {
    compositions,
    components,
    services,
    credentials,
  }
}

exports.describe = describe
