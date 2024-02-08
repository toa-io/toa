import { dev } from './dev'
import { authorization } from './auth'
import { cache } from './cache'
import { octets } from './octets'
import { cors } from './cors'
import { vary } from './vary'
import type { Family } from '../Directive'
import type { Interceptor } from '../Interception'

export const families: Family[] = [authorization, cache, octets, cors, vary, dev]
export const interceptors: Interceptor[] = [cors]
