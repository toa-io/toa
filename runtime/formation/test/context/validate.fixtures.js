'use strict'

const context = {
  runtime: {
    version: '0.0.0'
  },
  name: 'test',
  description: 'context fixture',
  version: '0.0.0',
  packages: 'namespaces/**/*',
  registry: {
    base: 'localhost:5000',
    platforms: ['linux/amd64', 'linux/arm/v7', 'linux/arm64']
  },
  compositions: [
    {
      name: 'foo',
      components: ['a.b', 'b.a']
    },
    {
      name: 'bar',
      components: ['d.c', 'a.b']
    }
  ],
  annotations: {
    '@toa.io/extensions.exposition': {
      host: 'dummies.toa.io',
      class: 'alb',
      annotations: {
        'alb.ingress.kubernetes.io/scheme': 'internet-facing',
        'alb.ingress.kubernetes.io/target-type': 'ip',
        'alb.ingress.kubernetes.io/listen-ports': '[{"HTTPS": 443}]'
      }
    }
  }
}

exports.context = context
