import * as _samples from './samples'

declare namespace toa.samples {

  namespace replay {

    namespace suite {
      type Components = (paths: string[]) => Promise<_samples.Suite>
    }

    type Components = (paths: string[]) => Promise<boolean>
    type Replay = (suite: _samples.Suite) => Promise<boolean>
  }

}

export * from './samples'

export const components: toa.samples.replay.Components
export const replay: toa.samples.replay.Replay
