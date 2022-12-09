import * as _suite from './suite'

declare namespace toa.samples {

  namespace replay {

    namespace suite {
      type Components = (paths: string[]) => Promise<_suite.Suite>
    }

    type Components = (paths: string[]) => Promise<boolean>
    type Context = (path: string) => Promise<boolean>
    type Replay = (suite: _suite.Suite) => Promise<boolean>
  }

}

export const context: toa.samples.replay.Context
export const components: toa.samples.replay.Components
export const replay: toa.samples.replay.Replay
