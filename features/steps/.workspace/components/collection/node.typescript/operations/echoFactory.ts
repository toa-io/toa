import { Computation } from './echoClass.ts'

export class ComputationFactory {
  create (): Computation {
    return new Computation()
  }
}
