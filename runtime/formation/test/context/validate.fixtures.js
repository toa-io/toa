'use strict'

/** @type {toa.formation.context.Context} */
const context = {
  runtime: {
    version: '0.0.0'
  },
  name: 'test',
  description: 'context fixture',
  version: '0.0.0',
  packages: 'domains/**/*',
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
  ]
}

exports.context = context
