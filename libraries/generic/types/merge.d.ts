declare namespace toa.generic {

  namespace merge {

    type Options = {
      overwrite?: boolean
      ignore?: boolean
    }

    type Predefined = (target: Object, source: Object) => Object
  }

  type Merge = (target: Object, source: Object, options: merge.Options, path: string[]) => Object
}

export const merge: toa.generic.Merge
export const overwrite: toa.generic.merge.Predefined
export const add: toa.generic.merge.Predefined
