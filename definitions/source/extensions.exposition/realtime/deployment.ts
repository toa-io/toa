import * as schemas from '../schemas.ts'
import { EXPIRE, STREAMS } from './const.ts'
import type { Dependency } from '@toa.io/operations'

/**
 * Where the streams are kept, given to every process: the components that route events write them,
 * and the gateway reads them. Asked for where a component declares routes, as any annotation is
 * where its extension is declared.
 */
export function deployment(_: unknown, annotation?: Annotation): Dependency {
  schemas.realtime.validate(annotation ?? null, 'Invalid realtime annotation')

  const { streams, expire } = annotation!
  const addresses = Array.isArray(streams) ? streams : [streams]
  const global = [{ name: STREAMS, value: addresses.join(' ') }]

  if (expire !== undefined) global.push({ name: EXPIRE, value: String(expire) })

  return { variables: { global } }
}

export interface Annotation {
  streams: string | string[]
  expire?: number
}
