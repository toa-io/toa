import * as _samples from './samples'

declare namespace toa.samples {

  namespace replay {
    type Component = (path: string) => Promise<boolean>
    type Suite = (path: string, component?: string) => Promise<_samples.Suite>
    type Replay = (suite: _samples.Suite) => Promise<boolean>
  }

}

export * from './samples'

export const component: toa.samples.replay.Component
export const replay: toa.samples.replay.Replay
