import { type Family } from '../Directive'
import Dev from './dev'
import Auth from './auth'
import Octets from './octets'

export const families: Family[] = [Auth, Octets, Dev]
