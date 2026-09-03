import type * as _deployment from './deployment.js'

declare namespace toa.deployment {

  interface Ingress {
    host: string
    class: string
    annotations?: object
  }

  interface Service extends _deployment.Deployable {
    port: number
    ingress?: Ingress

    /** Annotations for the Service itself, as opposed to `ingress.annotations`. */
    annotations?: object
  }

}

export type Service = toa.deployment.Service
