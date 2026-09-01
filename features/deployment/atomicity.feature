Feature: Atomicity deployment

  Scenario: One address
    Given I have a component `atom`
    And I have a context with:
      """
      atomicity:
        redis: redis://redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: default-atom
          variables:
            - name: TOA_ATOMICITY_REDIS
              value: redis://redis.example.com
      """

  # Independent servers, so the lock is taken on two of the three.
  Scenario: A quorum of addresses
    Given I have a component `atom`
    And I have a context with:
      """
      atomicity:
        redis:
          - redis://a.redis.example.com
          - redis://b.redis.example.com
          - redis://c.redis.example.com
      """
    When I export deployment
    Then exported values should contain:
      """yaml
      compositions:
        - name: default-atom
          variables:
            - name: TOA_ATOMICITY_REDIS
              value: redis://a.redis.example.com redis://b.redis.example.com redis://c.redis.example.com
      """

  # Four tolerate one loss exactly as three do, and two tolerate fewer than one does.
  Scenario: An even number of addresses is refused
    Given I have a component `atom`
    And I have a context with:
      """
      atomicity:
        redis:
          - redis://a.redis.example.com
          - redis://b.redis.example.com
      """
    Then exporting deployment fails with:
      """
      'atomicity.redis' takes an odd number of addresses, 2 given
      """
