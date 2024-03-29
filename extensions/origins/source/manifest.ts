import { resolve } from 'node:path'
import * as schemas from '@toa.io/schemas'
import type { Schema } from '@toa.io/schemas'

export function validate (manifest: Manifest): void {
  if (manifest !== null) schema.validate(manifest)
}

const path = resolve(__dirname, '../schemas/manifest.cos.yaml')
const schema: Schema<any> = schemas.schema(path)

export type Manifest = Record<string, string | null> | null
