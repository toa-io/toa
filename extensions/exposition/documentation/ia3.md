# Identity Authentication and Access Authorization Framework

## Concept

Identity is the fundamental entity within an authentication system that represents the unique identifier of an
individual, organization, application or device.
Authentication layer aimed to provide verified Identity for the request authrorization layer.

## Components

The Exposition extension provides a set of Components
that implement authentication.

| Component           | Description                                        |
|---------------------|----------------------------------------------------|
| `identity.basic`    | Basic authentication credentials                   |
| `identity.subjects` | OIDC/OAuth token subjects connected to an Identity |
| `identity.roles`    | Roles for the `role` Directive.                    |

