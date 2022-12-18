declare namespace toa.generic {

  namespace merge {

    type Options = {
      overwrite?: boolean
      ignore?: boolean
    }

  }

  type Merge = (target: Object, source: Object, options: merge.Options) => Object

  type Overwrite = (target: Object, source: Object) => Object
}

export type Options = toa.generic.merge.Options

export const merge: toa.generic.Merge
export const overwrite: toa.generic.Overwrite
