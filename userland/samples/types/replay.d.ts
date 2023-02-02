import * as _suite from "./suite";

declare namespace toa.samples.replay {

  type components = (paths: string[]) => Promise<boolean>
  type context = (path: string) => Promise<boolean>
  type replay = (suite: _suite.Suite, paths: string[]) => Promise<boolean>

}

export type context = toa.samples.replay.context
export type components = toa.samples.replay.components
export type replay = toa.samples.replay.replay
