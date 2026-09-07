import { value } from 'svas'
import { account } from '@/iam/svc/store'
import * as origin from './net'

/**
 * What the application serves. Bound to the account because what is in it is what that
 * identity may reach — signing in or out is a different answer, not a stale one.
 */
export const tree = value<origin.Discovered>({
  get: origin.read,
  persist: 'discovery:tree',
  bind: account,
})

export type Discovered = origin.Discovered
export type Resource = origin.Resource
export type Method = origin.Method
export type Described = origin.Described
export type Schema = origin.Schema
export type Octets = origin.Octets
