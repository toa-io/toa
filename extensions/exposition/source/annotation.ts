import { decode } from '@toa.io/generic'
import { syntax } from './RTD'

export function resolve (): syntax.Node {
  const value = process.env.TOA_EXPOSITION

  if (value === undefined)
    return syntax.createNode()

  return decode<syntax.Node>(value)
}
