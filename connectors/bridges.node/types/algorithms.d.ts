import { bridges } from '@toa.io/core/types'

declare namespace toa.node {

  namespace algorithms {

    interface Factory {
      create(): bridges.Algorithm
    }

  }

}
