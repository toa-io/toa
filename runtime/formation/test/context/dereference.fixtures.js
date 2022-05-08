'use strict'

const clone = require('clone-deep')

/**
 * @param id {string}
 * @return {toa.formation.component.Component}
 */
const component = (id) => {
  const [domain, name] = id.split('.')

  return {
    domain,
    name,
    version: '0.0.0',
    locator: {
      domain,
      name,
      id,
      label: `${domain}-${name}`
    }
  }
}

/** @type {toa.formation.context.Context} */
const context = {
  name: 'test',
  description: 'context fixture',
  version: '0.0.0',
  runtime: '0.0.0',
  packages: 'domains/**/*',
  registry: 'localhost:5000',
  components: [component('a.b'), component('b.a'), component('d.c')],
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

/** @type {toa.formation.context.Context} */
const expected = clone(context)

expected.compositions = [
  {
    name: 'foo',
    components: [component('a.b'), component('b.a')]
  },
  {
    name: 'bar',
    components: [component('d.c'), component('a.b')]
  }
]

exports.context = context
exports.expected = expected
