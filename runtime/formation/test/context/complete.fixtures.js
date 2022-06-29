'use strict'

const component = (id) => {
  const [namespace, name] = id.split('.')

  return {
    namespace,
    name,
    version: '0.0.0',
    locator: {
      namespace,
      name,
      id,
      label: `${namespace}-${name}`
    }
  }
}

const context = {
  runtime: '0.0.0',
  name: 'test',
  description: 'context fixture',
  version: '0.0.0',
  packages: 'namespaces/**/*',
  registry: 'localhost:5000',
  components: [
    component('a.b'),
    component('b.a'),
    component('d.a'),
    component('d.b'),
    component('d.c')
  ],
  compositions: [
    {
      name: 'foo',
      components: [component('a.b'), component('b.a')]
    },
    {
      name: 'bar',
      components: [component('d.c'), component('a.b')]
    }
  ]
}

/** @type {Array<toa.formation.context.Composition>} */
const compositions = [
  ...context.compositions,
  {
    name: 'd-a',
    components: [component('d.a')]
  },
  {
    name: 'd-b',
    components: [component('d.b')]
  }
]

exports.context = context
exports.compositions = compositions
