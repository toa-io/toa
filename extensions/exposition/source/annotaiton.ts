import { decode } from '@toa.io/generic'
import { schemas, type syntax } from './RTD'

export function read (): syntax.Node {
  const value = process.env.TOA_EXPOSITION

  if (value === undefined)
    return {}

  const annotation = decode(value)

  schemas.branch.validate(annotation)

  return annotation
}
