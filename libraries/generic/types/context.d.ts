declare namespace toa.generic {

  namespace context {
    interface Storage {
      apply(value: any, func: Function): Promise<any>

      get(): any
    }
  }

  type Context = (id: symbol) => context.Storage
}

export type Context = toa.generic.Context
