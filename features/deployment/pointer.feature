Feature: Pointer

  Scenario: Deploy a default URL
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis.example.com
      """

  Scenario: Deploy default URL set
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash:
        - redis://redis0.example.com
        - redis://redis1.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis0.example.com redis://redis1.example.com
      """

  Scenario Outline: Deploy URL for a <type>
    Given I have a component `stash`
    And I have a context with:
      """yaml
      stash:
        <key>: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """
      variables:
        default-stash:
          - name: TOA_STASH_DEFAULT_STASH
            value: redis://redis.example.com
      """
    Examples:
      | type      | key           |
      | component | default.stash |
      | namespace | default       |
