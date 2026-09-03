import { generate } from 'randomstring'

export const operations = {
  namespace: 'dummies',
  name: 'dummy',
  path: import.meta.dirname,
  bindings: ['foo', 'bar'],
  'bindings@local': ['foo'],
  operations: {
    add: {
      type: 'assignment'
    }
  },
  extensions: {
    '@toa.io/extensions.exposition': {
      ['/' + generate()]: {}
    },
    './dummies/extension': {
      ok: true
    }
  }
}
