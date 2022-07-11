import { ChildProcess } from 'node:child_process'

declare namespace toa.command {

  type Result = {
    output?: string
    error?: string
  } & ChildProcess

  type Execute = (command: string, input?: string) => Promise<Result>

}

export const execute: toa.command.Execute
