declare namespace toa.extensions.origins {

    type Headers = {
        [name: string]: string
    }

    type Body = Object | string

    type Method = 'GET' | 'POST' | 'PUT' | 'PATCH'

    type Request = {
        method: Method
        headers?: Headers
        body?: Body
    }

}
