declare namespace toa.generic {
  type Patch = (target: Object, source: Object) => Object
}

export const patch: toa.generic.Patch
