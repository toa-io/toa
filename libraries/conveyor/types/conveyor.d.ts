declare namespace toa.conveyor {

  type Processor<T, R> = (units: T[]) => Promise<R> | Promise<R[]>

  type Options = {
    capacity?: number
  }

  interface Conveyor<T, R> {
    process(unit: T): Promise<R>
  }

}
