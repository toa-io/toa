import { Request } from './request'

export type type = 'transition' | 'observation' | 'assignment' | 'computation' | 'effect'
export type scope = 'object' | 'objects' | 'changeset'

export class Operation {
  invoke<T = any> (request: Request): Promise<T>
}
