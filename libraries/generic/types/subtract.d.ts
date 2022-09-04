declare namespace toa.generic {

  namespace subtract {
    type ArrayOrSet = any[] | Set<any>
  }

  type Subtract = (a: subtract.ArrayOrSet, b: subtract.ArrayOrSet) => subtract.ArrayOrSet
}

export type Subtract = toa.generic.Subtract
