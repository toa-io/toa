declare namespace toa.libraries.generic {

    namespace retry {

        interface Options {
            /**
             * Maximum amount of retries
             */
            retries?: number

            /**
             * Base delay between retries
             */
            base?: number

            /**
             * Delay exponential factor
             */
            factor?: number

            /**
             * Maximum delay between retries
             */
            max?: number

            /**
             * Delay dispersion
             */
            dispersion?: number
        }

        type Next = () => void
        type Task = (retry: Next, attempt: number) => Promise<any>
    }

    type Retry = (func: retry.Task, options?: retry.Options, attempt?: number) => Promise<any>
}
