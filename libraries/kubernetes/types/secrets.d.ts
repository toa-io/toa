declare namespace toa.kubernetes {

  type Secret = {
    [key: string]: string
  }

  namespace secrets {

    type Declaration = {
      data: Secret
    }

    type Get = (name: string) => Promise<Declaration | null>

    type Store = (name: string, values: Secret) => Promise<void>

  }

}

export const get: toa.kubernetes.secrets.Get
export const store: toa.kubernetes.secrets.Store
