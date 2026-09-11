/**
 * @param id {string}
 * @return {toa.norm.component.Declaration}
 */
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

export const context = {
  name: 'test',
  description: 'context fixture',
  version: '0.0.0',
  runtime: '0.0.0',
  registry: 'localhost:5000',
  components: [component('a.b'), component('b.a'), component('d.c')],
  compositions: [
    {
      name: 'foo',
      components: ['a.b', 'b.a'],
      services: ['@toa.io/extensions.exposition', '@toa.io/extensions.realtime']
    },
    {
      name: 'bar',
      components: ['d.c']
    }
  ]
}
