import { generate } from 'randomstring'

const origin = {
  foo: generate(),
  bar: {
    baz: generate()
  },
  quu: [generate(), generate()]
}

export { origin }
