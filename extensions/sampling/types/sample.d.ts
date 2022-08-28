import { Reply } from '@toa.io/core/types'

declare namespace toa.sampling {

  type Sample = {
    reply?: Reply
  }

}
