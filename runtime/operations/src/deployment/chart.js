'use strict'

const chart = (context, dependencies) => {
  return {
    apiVersion: 'v2',
    type: 'application',
    name: context.name,
    description: context.description,
    version: context.version,
    appVersion: context.version,
    dependencies: dependencies.map((dependency) => dependency.chart)
  }
}

exports.chart = chart
