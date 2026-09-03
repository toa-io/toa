# Web Authentication

- [Standard](https://www.w3.org/TR/webauthn-2/)
- [Features](../features/passkeys.feature)
- [Credential management](credentials.md#passkeys)

## Origin

The relying party is the client. The origin a passkey is registered under, and the RP ID derived
from it, come from the request, so a passkey belongs to the origin of the client that registered
it, and a client on another origin does not see it.
