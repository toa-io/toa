'use strict'

const context = {
  runtime: '0.0.0',
  name: 'test',
  description: 'context fixture',
  version: '0.0.0',
  packages: 'domains/**/*',
  registry: 'localhost:5000',
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
