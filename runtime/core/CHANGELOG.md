# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [1.0.0-alpha.299](https://github.com/toa-io/toa/compare/v1.0.0-alpha.298...v1.0.0-alpha.299) (2026-09-10)

* feat(core)!: an endpoint a component does not provide is refused with a code ([6cabf9c](https://github.com/toa-io/toa/commit/6cabf9ccef9353f19a727888c667f5059c1ad2b5))

### Bug Fixes

* **cadence:** a delayed call is settled by its outcome, not by the attempt ([ac1c54b](https://github.com/toa-io/toa/commit/ac1c54b878e2705d81ce8365cf2f13e1d5ce0e83))
* **core:** the chain's test imports what the endpoint code already did ([ca474c8](https://github.com/toa-io/toa/commit/ca474c845a4376b40aaba534979859114c1b89d9))
* **core:** what the pump publishes is a debug line ([a1f98e9](https://github.com/toa-io/toa/commit/a1f98e90dc1dd4f43124d4f221f62cfd4d9b202a))

### Features

* **bindings.amqp:** a binding carries a channel, addressed by label ([17cf178](https://github.com/toa-io/toa/commit/17cf1782d1c47d033c02f99947b766eb9d45df75))
* **convergence:** deployments of one context converge ([8a70343](https://github.com/toa-io/toa/commit/8a70343cf6953aab58d4a25bac215508ff8d9a37))
* **core:** a call carries the chain it came by, and a circle is refused ([fccc887](https://github.com/toa-io/toa/commit/fccc8875b4af0d8cec914291c95db1c99e4a6a3f))
* **core:** a chain crosses an event, and the circle it closes is refused ([abd6ee2](https://github.com/toa-io/toa/commit/abd6ee22718c23dfdbc0974b3beec4afe0934533))
* **core:** a component reads the region it runs in ([fadc335](https://github.com/toa-io/toa/commit/fadc335bca9e71e6f2f592fa3ee13783cd71642b))
* **core:** a record carries the region that wrote it ([13ed187](https://github.com/toa-io/toa/commit/13ed187604f06dec66feec2e26ccf9dae30bb048))
* **core:** an outbox row is published to destinations ([cfb77b4](https://github.com/toa-io/toa/commit/cfb77b4826ff0f9560769a0996981e143d6525af))
* **core:** an outbox that owns no lane says so ([1ad693c](https://github.com/toa-io/toa/commit/1ad693cf5e2a6e2451e23e8c6d07831957ca150b))
* **core:** every system property is required ([52c468a](https://github.com/toa-io/toa/commit/52c468aacb03d0347a0e044f6bd76677bdd6af36))

### BREAKING CHANGES

* invoking an endpoint a component does not provide rejects with
  `EndpointException` (code 402) rather than an `AssertionError`.


# [1.0.0-alpha.293](https://github.com/toa-io/toa/compare/v1.0.0-alpha.292...v1.0.0-alpha.293) (2026-09-07)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.292](https://github.com/toa-io/toa/compare/v1.0.0-alpha.291...v1.0.0-alpha.292) (2026-09-07)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.291](https://github.com/toa-io/toa/compare/v1.0.0-alpha.290...v1.0.0-alpha.291) (2026-09-07)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.289](https://github.com/toa-io/toa/compare/v1.0.0-alpha.288...v1.0.0-alpha.289) (2026-09-07)

* A deploy moves only what changed, and a component sees none of the runtime's environment (#1073) ([f38e3db](https://github.com/toa-io/toa/commit/f38e3db533f24db866c57bfa1ef294eff1eaf499)), closes [#1073](https://github.com/toa-io/toa/issues/1073) [#1064](https://github.com/toa-io/toa/issues/1064) [#1066](https://github.com/toa-io/toa/issues/1066) [#1067](https://github.com/toa-io/toa/issues/1067) [#1068](https://github.com/toa-io/toa/issues/1068) [#1069](https://github.com/toa-io/toa/issues/1069) [#1071](https://github.com/toa-io/toa/issues/1071) [#1070](https://github.com/toa-io/toa/issues/1070) [#1072](https://github.com/toa-io/toa/issues/1072)

### BREAKING CHANGES

* a component that read `process.env.TOA_*` reads `context` instead;
  `echo(input)` no longer substitutes from the environment; a bash operation sees no
  `TOA_*`; images no longer set `USER node` — see migrations/289.md.


# [1.0.0-alpha.288](https://github.com/toa-io/toa/compare/v1.0.0-alpha.287...v1.0.0-alpha.288) (2026-09-06)

**Note:** Version bump only for package @toa.io/core





# [1.0.0-alpha.287](https://github.com/toa-io/toa/compare/v1.0.0-alpha.286...v1.0.0-alpha.287) (2026-09-06)

**Note:** Version bump only for package @toa.io/core
