declare namespace toa.libraries.schema {

    type Error = {
        message: string
        keyword: string
        property?: string
        schema?: string
        path?: string
    }

}

export type Error = toa.libraries.schema.Error
