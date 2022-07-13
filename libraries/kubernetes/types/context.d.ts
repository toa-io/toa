declare namespace toa.kubernetes.context {

  type Get = () => Promise<string>

  type Set = (context: string) => Promise<void>

}

export const get: toa.kubernetes.context.Get
export const set: toa.kubernetes.context.Set
