import type * as _deployment from './deployment'

declare namespace toa.deployment {

  interface Ingress {
    host: string
    class: string
    annotations?: object
  }

  interface Service extends _deployment.Deployable {
    port: number
    ingress?: Ingress
  }

}

export type Service = toa.deployment.Service
