import { generate } from 'randomstring'
import { random } from '@toa.io/generic'

const SHORTCUTS = {
  amqp: '@toa.io/bindings.amqp',
  mongodb: '@toa.io/storages.mongodb'
}

const object = { foo: random(), bar: { baz: generate() } }

export { object, SHORTCUTS }
