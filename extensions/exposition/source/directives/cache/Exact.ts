import { Control } from './Control.js'

export class Exact extends Control {
  protected override resolve (): string {
    return this.value
  }
}
