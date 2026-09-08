# Security

## Reporting a vulnerability

Report it privately through
[GitHub's vulnerability reporting](https://github.com/toa-io/toa/security/advisories/new) for
this repository. Do not open a public issue.

You get an acknowledgement within three days and a fix or a decision within thirty. A published
advisory credits the reporter unless they ask otherwise.

## Supported versions

The latest `alpha` prerelease and the latest release on npm. Older versions are not patched.

## What is verified

Every package on npm is published by the release workflow through OpenID Connect and carries
provenance; a version without an attestation from this repository was not published by it. The
images on `ghcr.io/toa-io` are built by the same run.
