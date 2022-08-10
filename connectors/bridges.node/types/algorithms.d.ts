import { bridges } from '@toa.io/core/types'

declare namespace toa.node {

  namespace algorithms {

    type Constructor = () => bridges.Algorithm

    interface Factory {
      create: Constructor
    }

  }

}
