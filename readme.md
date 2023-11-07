# Toa

Runtime for low-code distributed systems.

## Status

The project is under heavy development, while being used in production by its authors.
Non-scattered documentation is coming this fall.

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
  - [Access Control](extensions/exposition/documentation/access.md)
  - [File uploads](/extensions/exposition/documentation/octets.md), downloads, and processing.
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
  - Node.js support
- Service prototyping (inheritance)
  - Generic prototype
- Data and operations contracts
- Declarative API Gateway endpoints with authorization policies
- [Declarative integration tests](/userland/samples)
  - [Running in Docker](/runtime/cli/readme.md#replay)
- [Runtime bootloader API](/userland/stage)
- Development environment configuration
- [CLI](/runtime/cli)
- Extensibility:
  - Persistent storages
  - Communication protocols
  - Runtime core abstractions
  - Arbitrary services

### Operations

- Standalone infrastructure configuration
- Multi-environment configuration
- Components distribution across containers
- One-command fully automated deployment
  - Preset multi-arch docker images
  - Helm deployment to kubernetes
- CLI utilities
  - Secrets management
  - Remote Container Shell
