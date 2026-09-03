import { generate } from 'randomstring'

export const origin = {
  foo: generate(),
  bar: {
    baz: generate()
  },
  quu: [generate(), generate()]
}
