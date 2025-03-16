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
  - Batching
  - Data validation
  - Built-in implementations
    - MongoDB
    - SQL ([Knex](https://knexjs.org))
- [Configuration](/extensions/configuration) with secrets
- [API Gateway](/extensions/exposition)
  - Resource discovery
  - [Identity](extensions/exposition/documentation/identity.md)
    - Basis authentication
    - Identity federation (OIDC)
      - `id_token` authentication
      - Authorization code flow
    - Passkeys (WebAuthn)
    - OTP authentication
  - [Access control](extensions/exposition/documentation/access.md)
  - [Cache control](/extensions/exposition/documentation/cache.md)
  - [File uploads](/extensions/exposition/documentation/octets.md), downloads, and processing.
- Distributed lock manager
- [Telemetry](/extensions/telemetry)
  - Structured logs
- [Realtime events](/extensions/realtime)
- [BLOB storage](/extensions/storages)
  - MIME type detection and validation
  - Deduplication
  - Arbitrary orderings
  - Providers: file system, Amazon S3
- [Transient state](/extensions/stash)
- [External communications](/extensions/origins) governance
  - HTTP
  - AMQP

### Development

- Language interoperability
  - [Node.js](/connectors/bridges.node)
  - [Bash](/connectors/bridges.bash)
- Service prototyping (inheritance)
  - Generic prototype
- Data and operations contracts
- Declarative API Gateway endpoints with authorization policies
- [Integration tests SDK](/userland/stage)
- [Runtime bootloader API](/userland/stage)
- Development environment configuration
- [CLI](/runtime/cli)
- Extensibility:
  - Persistent storages
  - Communication protocols
  - Runtime core abstractions
  - Arbitrary services

### Operations

- Standardized containerization
- Environment variables
- Standalone infrastructure configuration
- One-command fully automated deployment
  - Preset multi-arch docker images
  - Helm deployment to kubernetes
- CLI utilities
  - Secrets management
  - Remote container shell
