import { Control } from './Control'

export class Exact extends Control {
  protected override resolve (): string {
    return this.value
  }
}
