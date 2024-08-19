import { basename, dirname, join } from 'node:path'
import { match } from './match'
import { transformations } from './transformations'
import type { TransformationOptions } from 'cloudinary'

export function parse (path: string, type: 'image' | 'video'): [string | null, TransformationOptions?] {
  const dir = dirname(path)
  const base = basename(path)

  if (!base.includes('.'))
    return [path]

  const params = match(base)

  if (params === null)
    return [null]

  const id = join(dir, params.id)
  const options: TransformationOptions[] = []

  for (const transform of transformations[type]) {
    const transformation = transform(params)

    if (transformation === null)
      continue

    options.push(transformation)
  }

  return [id, options]
}
