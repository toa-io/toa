# Developing a provider

1. Add an implementaion of the [Provider](../Provider.ts) interface under this directory.
2. Add an entry to the provider map in [`index.ts`](./index.ts).
3. Add a suite to the `suites` object in [`util.ts`](../.test/util.ts).
4. Run in root directory
    ```bash
    $ chmod +x localstack_init.sh
    ```
    to make [`localstack_init.sh`](../../../../localstack_init.sh) script executable.
5. Run in root directory 
    ```bash
    $ docker compose up localstack
    ```
    to start `localstack` service.
6. Run 
    ```bash
    $ npm test
    ```
    in the [`storages` directory](../..).

Provider's constructor must have the following signature: `constructor(url: URL)`
