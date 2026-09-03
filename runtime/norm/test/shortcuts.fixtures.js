import { generate } from 'randomstring'
import { random } from '@toa.io/generic'

export const SHORTCUTS = {
  amqp: '@toa.io/bindings.amqp',
  mongodb: '@toa.io/storages.mongodb'
}

export const object = { foo: random(), bar: { baz: generate() } }
