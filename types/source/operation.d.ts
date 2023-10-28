import { type Nopeable } from 'nopeable'

export interface Operation {
  mount: (context: any) => void | Promise<void>
  execute: (input: any, scope: any) => Promise<Nopeable<any>>
}
