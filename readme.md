# Toa

Runtime for low code eventually consistent distributed systems.

## Status

The project is under heavy development, while being used in production by its authors.
Non-scattered documentation is coming some time later.

## Features

### Runtime

- Interservice communications
  - Reliable RPC and Events ([ComQ](https://github.com/toa-io/comq))
  - Flow control
  - Eventual consistency guarantee (not yet)
  - Uniform interface
    - Input/query segregation
    - Successful rejections
    - Distributed exception handling
  - Transparent service discovery
  - Multi-protocol transmission
    - built-in support for AMQP and HTTP
  - In-memory communications
  - Messages validation
- Persistent state management
  - Concurrency control
  - Data validation
  - Multi-document transactions
  - [Transactional outbox](/documentation/outbox.md): state and its events commit together
  - Invariants (guards)
  - Built-in implementations
    - MongoDB
    - SQL ([Knex](https://knexjs.org))
- [Cadence](/extensions/cadence): calls that happen on their own time
  - a *pulse* calls a component's own operation on a cadence, with no schedule stored anywhere
  - a *delay* hands one call over to be made later, and answers the id that cancels it
- [Configuration](/extensions/configuration) with secrets
- [API Gateway](/extensions/exposition)
  - Resource discovery
  - [JSON-RPC](/extensions/exposition/documentation/rpc.md): every method the tree exposes, called
    as a procedure named after its route
  - [Model Context Protocol](/extensions/exposition/documentation/mcp.md): a method is a tool where
    it says so, and a model calls it as any other caller does
  - [Identity](extensions/exposition/documentation/identity.md)
    - Basis authentication
    - Identity federation (OIDC)
      - `id_token` authentication
      - Authorization code flow
    - Passkeys (WebAuthn)
    - OTP authentication
  - [OAuth 2.1 authorization server](/extensions/exposition/documentation/oauth.md): discovery,
    dynamic client registration, PKCE, and consent an application serves itself
  - [Access control](extensions/exposition/documentation/access.md)
  - [Cache control](/extensions/exposition/documentation/cache.md)
  - [File uploads](/extensions/exposition/documentation/octets.md), downloads, and processing.
  - [Throttling](/extensions/exposition/documentation/io.md#throttling): a distributed
    [GCRA](https://en.wikipedia.org/wiki/Generic_cell_rate_algorithm), with no per-request I/O
- [Atomicity](/connectors/atomicity): what the replicas of a component decide together
  - [Partitioning](/connectors/atomicity/readme.md#partitioning): an exclusive claim on one of a
    fixed number of slots
  - [Distributed lock manager](/connectors/atomicity/readme.md#locking)
  - [Shared rate metering](/connectors/atomicity/readme.md#metering)
- [Telemetry](/extensions/telemetry)
  - Structured logs
  - Distributed tracing
- [Introspection](/extensions/introspection): product topology collection and visualization
- [Realtime events](/extensions/realtime)
- [BLOB storage](/extensions/storages)
  - MIME type detection and validation
  - Providers: file system, Amazon S3, Cloudinary
- [Transient state](/extensions/stash)
- Built-in [Fetch](/extensions/fetch) with retries and telemetry

### Development

- Language interoperability
  - [Node.js](/connectors/bridges.node)
  - [Bash](/connectors/bridges.bash) :)
- Service prototyping (inheritance)
  - Generic prototype
- Data and operations schemas
- Declarative API Gateway endpoints with authorization policies
- [Integration tests SDK](/userland/stage)
- [Runtime bootloader API](/userland/stage)
- Development environment configuration
- [CLI](/runtime/cli)
  - `toa mono` — composition and extension services in one process
- Extensibility:
  - Persistent storages
  - Communication protocols
  - Runtime core abstractions
  - Arbitrary services

### Operations

- Standardized containerization
- [Compositions](/documentation/compositions.md): the components, and the extension services,
  deployed as one pod
- Resource management
- Environment variables
- Standalone infrastructure configuration
- One-command fully automated deployment
  - Preset multi-arch docker images
  - Helm deployment to kubernetes
  - Single-image (`toa deploy --mono`) deployment
- CLI utilities
  - Secrets management
  - Remote container shell
