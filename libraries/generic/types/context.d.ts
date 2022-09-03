declare namespace toa.generic {

  namespace context {
    interface Storage {
      apply(value: any, func: Function): Promise<void>

      get(): any
    }
  }

  type Context = (id: string) => context.Storage
}

export const context: toa.generic.Context
