# Toa

Low-code paltform for developers.

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
    - Multi-protocol transmission (built-in AMQP and HTTP support)
    - In-memory communications
    - Messages validation
- Persistent state management
    - Concurrency control
    - Batching
    - Data validation
    - Built-in implementations for MongoDB and SQL
- Shared cache
- Distributed lock manager
- API Gateway
    - Realtime resource discovery
    - Semantic method mapping
- Configuration
- Transient state
- External communications governance

### Development

- Language interoperability
    - Node.js support
- Service prototyping (inheritance)
- Generic prototype
- Declarative HTTP API endpoints
- Declarative integration tests
- Runtime bootloader API
- Development environment configuration
- CLI
- Extensibility:
    - Persistent storages
    - Communication protocols
    - Runtime core abstractions

### Operations

- Standalone infrastructure configuration
- Multi-environment configuration
- Components distribution across containers
- One-command fully automated deployment
    - Preset multi-arch docker images
    - Helm deployment to kubernetes
- Secrets management CLI
