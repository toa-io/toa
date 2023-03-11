declare namespace toa.generic {

  namespace reduce {

    type Reducer = (accumulator: Object, item: any) => void

  }

  type Reduce = (items: any[], reducer: reduce.Reducer) => Object

}

export const reduce: toa.generic.Reduce
