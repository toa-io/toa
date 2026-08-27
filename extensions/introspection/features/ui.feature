@ui
Feature: Publishing the UI

  The explorer serves the UI on its own port. The ingress forwards the mount path
  along with the request, so the server routes relative to it.

  What the page contains is Stage 3 — for now it only proves it is reachable.

  Scenario: The UI answers at its mount path
    Given the UI is published
    When "/.introspection" is requested
    Then the status is 200
    And the body is "OK!"

  Scenario: A trailing slash is the same resource
    Given the UI is published
    When "/.introspection/" is requested
    Then the status is 200

  Scenario: A query string does not change the resource
    Given the UI is published
    When "/.introspection?tab=edges" is requested
    Then the status is 200

  Scenario: Anything else is absent
    Given the UI is published
    When "/.introspection/whatever" is requested
    Then the status is 404

  Scenario: The path of the map API is not served by the UI
    Given the UI is published
    When "/introspection/nodes/" is requested
    Then the status is 404

  Scenario: Without an ingress the mount path is the root
    Given the UI is published at the root
    When "/" is requested
    Then the status is 200
    And the body is "OK!"
