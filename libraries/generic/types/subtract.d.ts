declare namespace toa.generic {

  namespace subtract {
    type ArrayOrSet = any[] | Set<any>
  }

  type Subtract = (a: subtract.ArrayOrSet, b: subtract.ArrayOrSet) => subtract.ArrayOrSet
}

export const subtract: toa.generic.Subtract
