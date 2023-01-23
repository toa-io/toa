import * as _suite from "./suite";

declare namespace toa.samples.replay {

  type Components = (paths: string[]) => Promise<boolean>
  type Context = (path: string) => Promise<boolean>
  type Replay = (suite: _suite.Suite) => Promise<boolean>

}

export type Context = toa.samples.replay.Context
export type Components = toa.samples.replay.Components
export type Replay = toa.samples.replay.Replay
