import { join } from 'node:path'

import schemas from '@toa.io/schemas'

const schema = schemas.schema(join(__dirname, 'schema.cos.yaml'))

export function validate (node: Node): void {
  schema.validate(node)
}

export const methods: Set<method> = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])

export type Node = {
  [k: string]: Node | Mapping | any // directive
}

export type Methods = {
  [k in method]?: Mapping
}

export type method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type Mapping = {
  operation: string
  query?: object
}
