@ui
Feature: Publishing the UI

  The explorer serves the UI on its own port, out of the directory `ui` builds. The
  mount path is baked into the bundle and forwarded by the ingress, so the server
  routes relative to it.

  Scenario: The root is the way in
    Given the UI is published
    When "/" is requested
    Then the status is 302
    And the "location" header is "/.introspection/"

  Scenario: The UI answers at its mount path
    Given the UI is published
    When "/.introspection" is requested
    Then the status is 200
    And the body contains "the page"

  Scenario: A trailing slash is the same resource
    Given the UI is published
    When "/.introspection/" is requested
    Then the status is 200
    And the body contains "the page"

  Scenario: A query string does not change the resource
    Given the UI is published
    When "/.introspection?tab=edges" is requested
    Then the status is 200
    And the body contains "the page"

  Scenario: An unknown route is the page
    The client router knows what routes there are; this server does not.

    Given the UI is published
    When "/.introspection/whatever" is requested
    Then the status is 200
    And the body contains "the page"

  Scenario: A route that looks like a file is still a route
    A component is named `namespace.component`, so the address of one carries a dot and
    an extension is no way to tell an asset from a route.

    Given the UI is published
    When "/.introspection/identity.passkeys/" is requested
    Then the status is 200
    And the body contains "the page"

  Scenario: And with no trailing slash to give it away
    Given the UI is published
    When "/.introspection/identity.passkeys" is requested
    Then the status is 200
    And the body contains "the page"

  Scenario: A hashed asset is served forever
    Given the UI is published
    When "/.introspection/_app/immutable/asset.js" is requested
    Then the status is 200
    And the "content-type" header is "text/javascript; charset=utf-8"
    And the "cache-control" header is "public, max-age=31536000, immutable"

  Scenario: The page itself is never cached
    Given the UI is published
    When "/.introspection/" is requested
    Then the "cache-control" header is "no-cache"

  Scenario: A missing asset is missing
    Given the UI is published
    When "/.introspection/_app/immutable/absent.js" is requested
    Then the status is 404

  Scenario: The path of the map API is not served by the UI
    Given the UI is published
    When "/introspection/nodes/" is requested
    Then the status is 404

  Scenario: A path that only looks like the mount path is absent
    Given the UI is published
    When "/.introspectionable" is requested
    Then the status is 404

  Scenario: Nothing outside the site is reachable
    Given the UI is published
    When "/.introspection/%2e%2e/%2e%2e/package.json" is requested
    Then the status is 404
