// Preloaded into the release's `lerna publish`. Lerna hands libnpmpublish npm's configuration as
// strings, and with no `timeout` of a number sigstore waits five seconds for Rekor. Rekor that is
// slower than that writes the entry anyway, the client's retry is then refused with a 409 for
// that very entry, and the package is not published. A minute is what a slow Rekor needs.
require('sigstore/dist/config').DEFAULT_TIMEOUT = 60_000
