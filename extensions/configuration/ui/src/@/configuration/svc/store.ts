import { collection, values } from 'svas'
import { account } from '@/iam/svc/store'
import * as origin from './net'

export const configurations = collection<Configuration>({
  get: origin.list,
  values: values<Configuration>({ get: origin.get }),
  persist: 'configuration:values',
  bind: account,
  stale: true,
})

export type Configuration = origin.Configuration
export type Node = origin.Node
