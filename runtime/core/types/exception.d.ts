declare namespace toa.core {

    interface Exception {
        code: number
        message: string
    }

}

export type Exception = toa.core.Exception
