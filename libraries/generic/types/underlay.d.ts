declare namespace toa.generic {

  namespace underlay {
    type Callback = (segments: string[], arguments?: string) => any
    type Constructor = (callback: Callback) => Underlay
  }

  interface Underlay {
    (...args: any[]): any

    [key: string]: Underlay
  }

}

export type Underlay = toa.generic.Underlay

export const underlay: toa.generic.underlay.Constructor
