# Toa

Toa is a way to build and operate reliable distributed systems at an incredible development speed.

## Status

The project is under heavy development, while being used in production by its authors.
Non-scattered documentation is coming this summer.

## Features

### Runtime

- Interservice communications
  - Seamless fault tolerant RPC and Events
  - Flow control
  - Eventual consistency guarantee
  - Uniform interface
    - Input/query segregation
    - Output/error replies
  - Automatic service discovery
  - Distributed exception handling
  - Multi-protocol transmission
    - built-in support for AMQP and HTTP
  - In-memory communications
  - I/O validation
- Persistent state management
  - Concurrency control
  - Batch Inserts
  - Data validation
  - Built-in implementations
    - MongoDB, Amazon DocumentDB
    - PostgreSQL, MSSQL, MySQL, MariaDB, Oracle, CockroachDB, SQLite3, Better-SQLite3, and Amazon Redshift
- [API Gateway](/extensions/exposition)
  - Realtime resource discovery
  - Semantic method mapping
  - [Identity Authentication and Access Authorization](extensions/exposition/documentation/ia3.md)
  - Realtime events
- [Configuration](/extensions/configuration)
- Transient state
- [External communications](/extensions/origins) with permissions
  - HTTP
  - AMQP

### Development

- Language interoperability
  - Node.js support with [types](/types)
- Service prototyping (inheritance)
  - Generic prototype
- Data and operations contracts
- Declarative API Gateway endpoints with authorization policies
- [Declarative unit and integration tests](/userland/samples)
  - [Running in Docker](/runtime/cli/readme.md#replay)
- [Runtime bootloader API](/userland/stage)
- [CLI](/runtime/cli)
- Extensibility:
  - Persistent storages
  - Communication protocols
  - Runtime core abstractions
  - Arbitrary services
- [Development environment configuration]

### Operations

- Standalone infrastructure configuration
- Components distribution across containers
- One-command fully automated deployment
  - Preset multi-arch docker images
  - Helm deployment to kubernetes
- CLI utilities
  - Secrets management
  - Remote Container Shell 
