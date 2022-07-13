declare namespace toa.generic {

  namespace remap {
    type Callback = (value: any, key?: any) => any
  }

  type Remap = (object: Object, callback: remap.Callback) => Object
}

export const remap: toa.generic.Remap
