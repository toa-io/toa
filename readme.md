# Toa

Toa is a way to build and operate reliable distributed systems at an incredible development speed.

## Status

The project is under heavy development, while being used in production by its authors.
Non-scattered documentation is coming this summer.

## Features

### Runtime

- Interservice communications
    - Seamless fault tolerant RPC and Events
    - Uniform intercommunication interface
        - Input/query segregation
        - Output/error replies
    - Automatic service discovery
    - Distributed exception handling
    - Multi-protocol transmission
    - Built-in AMQP and HTTP support
    - In-memory communications within compositions
    - Message contract validation
- Persistent state management
    - Concurrency control
    - Batching
    - Data contract validation
    - Built-in implementations for MongoDB and SQL
- HTTP API with runtime resource discovery
- External communications with permissions
- Configuration
- Transient state

### Development

- Language interoperability
    - Node.js support
- Service prototyping (inheritance)
- Generic prototype
- Declarative data and operations contracts
- Declarative HTTP API endpoints
- Declarative integration tests
- Runtime bootloader API
- CLI
- Unlimited extensibility
    - persistent storages
    - communication protocols
    - runtime core abstractions
- Development environment configuration

### Operations

- Standalone infrastructure configuration
- Components distribution across compositions (containers)
- One-command fully automated deployment
    - Preset multi-arch docker images
    - Helm deployment to kubernetes
- Secrets management CLI
