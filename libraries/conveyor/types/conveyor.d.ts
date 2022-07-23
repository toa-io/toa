declare namespace toa.conveyor {

  type Processor<T, R> = (units: T[]) => Promise<R[]>

  type Options = {
    lines: number
    capacity: number
  }

  interface Conveyor<T, R> {
    push(unit: T): Promise<R>
  }

  interface CapacityException extends Error {
  }

  interface ProcessorException extends Error {
  }

}
