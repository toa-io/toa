import { Reply } from '@toa.io/core/types'

declare namespace toa.sampling {

  type Sample = {
    input?: any
    reply?: Reply
  }

}

export type Sample = toa.sampling.Sample
