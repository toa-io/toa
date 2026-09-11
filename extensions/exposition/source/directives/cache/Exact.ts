import { Control } from './Control.ts'

export class Exact extends Control {
  protected override resolve(): string {
    return this.value
  }
}
