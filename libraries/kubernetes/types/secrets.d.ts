declare namespace toa.kubernetes {

    type Secret = {
        [key: string]: string
    }

    namespace secrets {

        type Declaration = {
            metadata: {
                name: string
            }
            data: Secret
        }

        type Get = (name: string) => Promise<Declaration | null>

        type Store = (name: string, values: Secret, type?: string) => Promise<void>

    }

}

export const get: toa.kubernetes.secrets.Get
export const store: toa.kubernetes.secrets.Store
