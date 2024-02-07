import Dev from './dev'
import Auth from './auth'
import Cache from './cache'
import Octets from './octets'
import { cors } from './cors'
import { vary } from './vary'
import type { Family } from '../Directive'
import type { Interceptor } from '../Interception'

export const families: Family[] = [Auth, Octets, Dev, Cache, cors, vary]
export const interceptors: Interceptor[] = [cors]
