import { resolve } from 'node:path'
import { namespace } from '@toa.io/schemas'
import type { Declaration } from './providers'
import type { Schema } from '@toa.io/schemas'
import type { Annotation } from './Annotation'

const path = resolve(__dirname, '../schemas')
const ns = namespace(path)

export const annotation: Schema<Annotation> = ns.schema<Annotation>('annotation')
export const s3: Schema<Declaration> = ns.schema<Declaration>('s3')
export const cloudinary: Schema<Declaration> = ns.schema<Declaration>('cloudinary')
export const fs: Schema<Declaration> = ns.schema<Declaration>('fs')
export const mem: Schema<Declaration> = ns.schema<Declaration>('mem')
export const tmp: Schema<Declaration> = ns.schema<Declaration>('tmp')
export const test: Schema<Declaration> = ns.schema<Declaration>('test')
