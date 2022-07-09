declare namespace toa.generic {

  namespace merge {

    type Options = {
      override?: boolean
      ignore?: boolean
    }

  }

  type Merge = (target: Object, source: Object, options: merge.Options) => Object
}

export type Options = toa.generic.merge.Options

export const merge: toa.generic.Merge
