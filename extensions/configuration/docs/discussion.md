# Discussion

## Change Requests

- feat(configuration): add configuration extension
    - manifest (schema) validation
    - annotations (values) validation
    - context extension
- feat(formation): add well-known extension 'configuration'
    - component
    - context
- feat(node): add well-known context extension 'configuration'

## Statements

### Common

- Secrets are being deployed separately by `toa conceal` command

### 1: Environment variables

- Configuration values and secrets are mapped as environment variables to composition deployments
- Extensions may expose *deployment mutators*, which are able to modify deployment declaration
- Configuration context extension reads environment variables to resolve configuration and secrets

### 2: Dedicated Components

- Hot updates
- [Configuration consistency](consistency.md)

## Questions

### Where are values comes from?

Environment variables.

### Is there a configuration service or configuration component?

No. It will be implemented later as a part of [consistent configuration](consistency.md).

### How are configuration values being stored?

As a kubernetes secrets mapped as environment variables.

### Where are secrets being stored and how do they resolve to value?

As a kubernetes secrets mapped as environment variables.


