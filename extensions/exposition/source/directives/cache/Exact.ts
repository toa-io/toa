import { Control, type Resolution } from './Control.ts'

export class Exact extends Control {
  protected override resolve(): Resolution {
    return { control: this.value, vary: false }
  }
}
