# Discussion

## Change Requests

- [x] feat(configuration): add configuration extension
    - manifest (schema) validation
    - context extension
- [x] feat(formation): add well-known extension 'configuration'
    - component
    - context
- [x] feat(node): add well-known context extension 'configuration'
- [x] feat(configuration): add concise declarations
- [x] feat(configuration): add runtime configuration resolution
- [ ] feat(operations): add configuration deployment
    - annotations (values) validation
- [ ] feat(configuration): add secrets resolution
- [ ] feat(operations): add secrets deployment
- [ ] feat(cli): add `toa conceal`
    - validate type
- [ ] feat(cli): add `toa configure`
    - use JSONSchema title

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

### Is configuration a single environment variable or a set (one per component)?

#### Context Configuration

In later versions, context extension will resolve configuration values by component locator. Given that it is yet
unknown when this will happen, a certain context might have appeared which configuration is big enough to not fit the
environment variable limitations.

That is, Context Configuration must be mapped as a set of environment variables (one per component). Values are
serialized Configuration Objects.

> This will also allow to configure local environment per component.

#### Secrets

Secrets are mapped per secret as they are not bound to components.

### Is configuration a single kubernetes secret or a set (one per component)?

#### Configuration

Single secret with a set of values per component.

#### Secrets

Once kubernetes secret per configuration secret.

### Is there an option to configure local environment?

<dl>
<dt><code>toa configure &lt;component&gt;</code></dt>
<dd>Create local environment configuration values</dd>
</dl>

## References

- [#125](https://github.com/toa-io/toa/issues/125)
- [#132](https://github.com/toa-io/toa/issues/132)
