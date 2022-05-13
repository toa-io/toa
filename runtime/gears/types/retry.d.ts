declare namespace toa.gears {

    namespace retry {

        interface Options {
            /**
             * Maximum amount of retries
             */
            retries?: number

            /**
             * Exponential factor
             */
            factor?: number

            /**
             * Base delay between retries
             */
            base?: number

            /**
             * Maximum delay between retries
             */
            max?: number

            /**
             * Delay dispersion
             */
            dispersion?: number
        }

        type Task<T> = (...args: any[]) => Promise<T>
    }

    type Retry<T> = (func: retry.Task<T>, options?: retry.Options, attempt?: number) => Promise<T>
}

export type RetryOptions = toa.gears.retry.Options
export type RetryTask<T> = toa.gears.retry.Task<T>
export type Retry<T> = toa.gears.Retry<T>
